import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const packagesDir = join(root, "packages");
const pluginsDir = join(root, "plugins");
const command = process.argv[2];
const bumpArg = process.argv[3] ?? "patch";
const validBumps = new Set(["major", "minor", "patch"]);
if (!["manifest", "version", "assets"].includes(command)) {
  console.error("usage: node scripts/release.mjs <manifest|version|assets> [major|minor|patch]");
  process.exit(2);
}
if (command === "version" && !validBumps.has(bumpArg)) {
  console.error(`invalid version bump: ${bumpArg}`);
  process.exit(2);
}

/** Read and parse a UTF-8 JSON file. */
async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

/** Serialize a value as consistently formatted UTF-8 JSON. */
async function writeJson(path, value) {
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/** Execute a command from the repository root and return trimmed stdout. */
async function exec(command, args) {
  const { stdout } = await execFileAsync(command, args, { cwd: root });
  return stdout.trim();
}

/** Calculate the next semantic version for the requested release bump. */
function bumpVersion(version, kind) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0))
    throw new Error(`invalid semver: ${version}`);
  if (kind === "major") return `${parts[0] + 1}.0.0`;
  if (kind === "minor") return `${parts[0]}.${parts[1] + 1}.0`;
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

/** Discover package implementations from the flat packages directory. */
async function discoverPackages() {
  const entries = await fs.readdir(packagesDir, { withFileTypes: true });
  const packages = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = join(packagesDir, entry.name);
    try {
      const [stack, pkg] = await Promise.all([
        readJson(join(dir, "stack.json")),
        readJson(join(dir, "package.json")),
      ]);
      packages.push({ dir, stack, pkg });
    } catch {}
  }
  packages.sort((a, b) => a.stack.id.localeCompare(b.stack.id));
  return packages;
}

/** Read pack/profile membership from the composition catalog. */
async function catalogMembership() {
  const source = await fs.readFile(join(pluginsDir, "composition", "src", "catalog.ts"), "utf8");
  const packs = {};
  const profiles = {};
  let section = null;
  let current = null;
  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("export const packs")) {
      section = "packs";
      continue;
    }
    if (line.startsWith("export const profiles")) {
      section = "profiles";
      continue;
    }
    const objectMatch = line.match(/^id:\s*'([^']+)'/);
    if (objectMatch) {
      current = objectMatch[1];
      if (section === "packs") packs[current] = [];
      else if (section === "profiles") profiles[current] = [];
      continue;
    }
    const quoted = line.match(/'([^']+)'/g)?.map((value) => value.slice(1, -1)) ?? [];
    if (current !== null) {
      if (section === "packs")
        for (const id of quoted) if (id.startsWith("stack.")) packs[current].push(id);
      if (section === "profiles")
        for (const id of quoted) if (id.startsWith("stack.")) profiles[current].push(id);
    }
    if (line === "},") current = null;
  }
  return { packs, profiles };
}

/** Build the machine-readable release catalog from package and catalog metadata. */
async function buildManifest() {
  const rootPackage = await readJson(join(root, "package.json"));
  const packages = await discoverPackages();
  const byId = new Map(packages.map((item) => [item.stack.id, item]));
  const membership = await catalogMembership();
  const catalogPackages = packages.map(({ stack, pkg, dir }) => ({
    id: stack.id,
    name: stack.name,
    version: stack.version,
    kind: stack.kind,
    dependencies: (stack.dependencies ?? []).map((id) => ({
      id,
      version: byId.get(id)?.stack.version ?? null,
    })),
    optionalDependencies: (stack.optionalDependencies ?? []).map((id) => ({
      id,
      version: byId.get(id)?.stack.version ?? null,
    })),
    files: stack.files,
    packagePath: relative(root, dir),
    packagePrivate: pkg.private === true,
    packs: Object.entries(membership.packs)
      .filter(([, ids]) => ids.includes(stack.id))
      .map(([id]) => id),
    profiles: Object.entries(membership.profiles)
      .filter(([, ids]) => ids.includes(stack.id))
      .map(([id]) => id),
  }));
  return {
    format: 1,
    stack: { name: rootPackage.name, version: rootPackage.version },
    packages: catalogPackages,
    packs: membership.packs,
    profiles: membership.profiles,
  };
}

/** Generate the release catalog and its integrity checksum. */
async function manifest() {
  const value = await buildManifest();
  const outputDir = join(root, ".release");
  await fs.mkdir(outputDir, { recursive: true });
  const output = join(outputDir, "stack-release.json");
  await writeJson(output, value);
  const integrity = createHash("sha256")
    .update(await fs.readFile(output))
    .digest("hex");
  await fs.writeFile(
    join(outputDir, "stack-release.sha256"),
    `${integrity}  stack-release.json\n`,
    "utf8",
  );
  console.log(output);
}

/** Build self-contained plugin and pack archives with symlink targets dereferenced. */
async function assets() {
  const rootPackage = await readJson(join(root, "package.json"));
  const outputDir = join(root, ".release");
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  await manifest();
  const version = rootPackage.version;
  const archives = [
    ["plugins", `dsh-stack-plugins-${version}.tar.gz`],
    ["plugins/packs", `dsh-stack-packs-${version}.tar.gz`],
  ];
  for (const [source, archive] of archives) {
    await exec("tar", ["-chzf", join(outputDir, archive), "-C", root, source]);
  }
  const files = await fs.readdir(outputDir);
  const checksums = [];
  for (const file of files.sort()) {
    if (file.endsWith(".sha256")) continue;
    const digest = createHash("sha256")
      .update(await fs.readFile(join(outputDir, file)))
      .digest("hex");
    checksums.push(`${digest}  ${file}`);
  }
  await fs.writeFile(join(outputDir, "SHA256SUMS"), `${checksums.join("\n")}\n`, "utf8");
  console.log(files.map((file) => join(outputDir, file)).join("\n"));
}

/** Apply semantic versioning to the root package and packages changed by the latest commit. */
async function version() {
  const rootPackagePath = join(root, "package.json");
  const rootPackage = await readJson(rootPackagePath);
  const commitText = await exec("git", ["log", "--format=%s%n%b", "-n", "200"]);
  const rootBump = /BREAKING CHANGE|^[^\n]*!:/m.test(commitText)
    ? "major"
    : /^(feat)(\([^)]*\))?:/m.test(commitText)
      ? "minor"
      : bumpArg;
  rootPackage.version = bumpVersion(rootPackage.version, rootBump);
  await writeJson(rootPackagePath, rootPackage);

  const packages = await discoverPackages();
  for (const item of packages) {
    const dirName = relative(packagesDir, item.dir);
    const changed = await exec("git", [
      "diff",
      "--name-only",
      "HEAD^",
      "HEAD",
      "--",
      `packages/${dirName}`,
    ]);
    if (!changed) continue;
    const messages = await exec("git", [
      "log",
      "--format=%s%n%b",
      "-n",
      "50",
      "--",
      `packages/${dirName}`,
    ]);
    const bump = /BREAKING CHANGE|^[^\n]*!:/m.test(messages)
      ? "major"
      : /^(feat)(\([^)]*\))?:/m.test(messages)
        ? "minor"
        : bumpArg;
    const next = bumpVersion(item.stack.version, bump);
    item.stack.version = next;
    item.pkg.version = next;
    await writeJson(join(item.dir, "stack.json"), item.stack);
    await writeJson(join(item.dir, "package.json"), item.pkg);
  }
  console.log(`Stack version: ${rootPackage.version}`);
}

if (command === "manifest") await manifest();
else if (command === "assets") await assets();
else await version();
