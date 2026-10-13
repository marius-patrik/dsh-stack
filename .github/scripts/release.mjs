// jscpd:ignore-start -- release manifest, semver and packaging share package traversal intentionally
/** Build native package archives and one versioned Stack release catalog. */
import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, basename } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { listPluginPackageDirs, listBundlePackageDirs, readJson, root } from "./lib/repo-paths.mjs";

const execFileAsync = promisify(execFile);
const command = process.argv[2];
const bumpArg = process.argv[3] ?? "patch";
const releaseDir = join(root, ".release");

/** Run an executable relative to the repository. */
async function run(cmd, args, options = {}) {
  const { stdout } = await execFileAsync(cmd, args, { cwd: root, ...options });
  return stdout.trim();
}

/** Discover native plugin and bundle leaves; profiles are intentionally not npm packages. */
async function discoverPackages() {
  const sources = [
    ...(await listPluginPackageDirs()).map((dir) => ({ dir, kind: "plugin" })),
    ...(await listBundlePackageDirs()).map((dir) => ({ dir, kind: "bundle" })),
  ];
  const result = [];
  const names = new Set();
  for (const { dir, kind } of sources) {
    const pkg = await readJson(join(dir, "package.json"));
    if (pkg.private === true) continue;
    if (typeof pkg.name !== "string" || !pkg.name.startsWith("@dsh-stack/")) {
      throw new Error(`Not a native Stack package: ${relative(root, dir)}`);
    }
    if (names.has(pkg.name)) throw new Error(`Duplicate native package: ${pkg.name}`);
    names.add(pkg.name);
    result.push({ dir, kind, pkg, relativePath: relative(root, dir) });
  }
  return result.sort((a, b) => a.pkg.name.localeCompare(b.pkg.name));
}

/** Return npm-compatible exact ranges for local workspace references. */
function publishableManifest(component, byName) {
  const pkg = structuredClone(component.pkg);
  // A concrete source repository is required for npm's GitHub trusted publishing.
  pkg.repository = {
    type: "git",
    url: "https://github.com/marius-patrik/dsh-stack.git",
    directory: component.relativePath,
  };
  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
    "devDependencies",
  ]) {
    for (const [name, value] of Object.entries(pkg[section] ?? {})) {
      if (typeof value !== "string" || !value.startsWith("workspace:")) continue;
      const dependency = byName.get(name);
      if (!dependency) throw new Error(`${pkg.name}: unresolved workspace dependency ${name}`);
      pkg[section][name] = dependency.pkg.version;
    }
  }
  return pkg;
}

/** Topologically order packages so prerequisites publish before bundle parents. */
function publicationOrder(packages) {
  const byName = new Map(packages.map((pkg) => [pkg.pkg.name, pkg]));
  const visited = new Set();
  const visiting = new Set();
  const sorted = [];
  /** Walk a published package's direct runtime dependencies. */
  function visit(pkg) {
    if (visited.has(pkg.pkg.name)) return;
    if (visiting.has(pkg.pkg.name)) throw new Error(`Dependency cycle: ${pkg.pkg.name}`);
    visiting.add(pkg.pkg.name);
    for (const dep of Object.keys(pkg.pkg.dependencies ?? {})) {
      const local = byName.get(dep);
      if (local) visit(local);
    }
    visiting.delete(pkg.pkg.name);
    visited.add(pkg.pkg.name);
    sorted.push(pkg);
  }
  for (const pkg of packages) visit(pkg);
  return sorted;
}

/** Write JSON in a deterministic release artifact format. */
async function writeJson(path, value) {
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

/** Produce a manifest of the complete package graph, including bundles. */
async function buildManifest(packages) {
  const rootPackage = await readJson(join(root, "package.json"));
  const byName = new Map(packages.map((item) => [item.pkg.name, item]));
  return {
    format: 3,
    stack: { name: rootPackage.name, version: rootPackage.version },
    packages: packages.map((item) => {
      const published = publishableManifest(item, byName);
      return {
        id: published.name,
        name: published.name,
        version: published.version,
        kind: item.kind,
        packagePath: item.relativePath,
        dependencies: published.dependencies ?? {},
        optionalDependencies: published.optionalDependencies ?? {},
        peerDependencies: published.peerDependencies ?? {},
        bundle: published.dsh?.bundle?.patch ?? null,
      };
    }),
    profiles: ["web", "headless", "tui"],
  };
}

/** Persist a manifest plus content hash for consumers and verifiers. */
async function writeManifest(manifest) {
  await fs.mkdir(releaseDir, { recursive: true });
  const path = join(releaseDir, "stack-release.json");
  await writeJson(path, manifest);
  const digest = createHash("sha256")
    .update(await fs.readFile(path))
    .digest("hex");
  await fs.writeFile(join(releaseDir, "stack-release.sha256"), `${digest}  stack-release.json\n`);
}

/** Stage the publishable package without installing a second runtime or rewriting sources. */
async function stagePackage(item, byName, stageRoot) {
  const slug = item.pkg.name.slice("@dsh-stack/".length);
  const target = join(stageRoot, slug);
  await fs.cp(item.dir, target, {
    recursive: true,
    force: true,
    dereference: true,
    filter: (path) =>
      !relative(item.dir, path)
        .split(/[\\/]/)
        .some((part) => part === "node_modules" || part === ".git"),
  });
  const published = publishableManifest(item, byName);
  await writeJson(join(target, "package.json"), published);
  if (item.kind === "bundle") {
    await fs.access(join(target, "dist", "cordis.patch.yml"));
  }
  return target;
}

/** Build npm tarballs with resolved internal versions and generate integrity inventory. */
async function assets() {
  const packages = await discoverPackages();
  const byName = new Map(packages.map((item) => [item.pkg.name, item]));
  const order = publicationOrder(packages);
  await fs.rm(releaseDir, { recursive: true, force: true });
  await fs.mkdir(releaseDir, { recursive: true });
  const stage = join(releaseDir, ".stage");
  await fs.mkdir(stage, { recursive: true });
  const archives = [];
  for (const item of order) {
    const staged = await stagePackage(item, byName, stage);
    const json = await run("npm", ["pack", staged, "--pack-destination", releaseDir, "--json"]);
    const entries = JSON.parse(json);
    const file = entries?.[0]?.filename;
    if (typeof file !== "string")
      throw new Error(`${item.pkg.name}: npm pack did not return a tarball`);
    archives.push({
      name: item.pkg.name,
      version: item.pkg.version,
      file,
      integrity: entries[0].integrity,
    });
  }
  await fs.rm(stage, { recursive: true, force: true });
  await writeManifest(await buildManifest(packages));
  await writeJson(join(releaseDir, "component-assets.json"), { format: 3, packages: archives });
  const checksums = [];
  for (const file of (await fs.readdir(releaseDir)).sort()) {
    if (file.endsWith(".sha256") || file === "SHA256SUMS") continue;
    const hash = createHash("sha256")
      .update(await fs.readFile(join(releaseDir, file)))
      .digest("hex");
    checksums.push(`${hash}  ${file}`);
  }
  await fs.writeFile(join(releaseDir, "SHA256SUMS"), `${checksums.join("\n")}\n`);
  console.log(
    `Packed ${archives.length} native npm packages, including ${packages.filter((p) => p.kind === "bundle").length} bundles.`,
  );
}

/** Bump a package semver without altering unrelated package metadata. */
function bumpVersion(version, kind) {
  const values = version.split(".").map(Number);
  if (values.length !== 3 || values.some((v) => !Number.isInteger(v) || v < 0))
    throw new Error(`Invalid semver: ${version}`);
  if (kind === "major") return `${values[0] + 1}.0.0`;
  if (kind === "minor") return `${values[0]}.${values[1] + 1}.0`;
  return `${values[0]}.${values[1]}.${values[2] + 1}`;
}

/** Bump the root and changed package versions based on their changes. */
async function version() {
  const rootPath = join(root, "package.json");
  const main = await readJson(rootPath);
  main.version = bumpVersion(main.version, bumpArg);
  await writeJson(rootPath, main);
  for (const item of await discoverPackages()) {
    const changed = await run("git", [
      "diff",
      "--name-only",
      "HEAD^",
      "HEAD",
      "--",
      item.relativePath,
    ]);
    if (!changed) continue;
    const next = bumpVersion(item.pkg.version, bumpArg);
    item.pkg.version = next;
    await writeJson(join(item.dir, "package.json"), item.pkg);
    const legacyPath = join(item.dir, "stack.json");
    try {
      const legacy = await readJson(legacyPath);
      legacy.version = next;
      await writeJson(legacyPath, legacy);
    } catch {
      /* Native bundles have no legacy stack.json. */
    }
  }
  console.log(`Stack version: ${main.version}`);
}

/** Pack an isolated file:-only dependency graph for a clean native DSH CI installation. */
async function localFixtures() {
  const packages = await discoverPackages();
  const byName = new Map(packages.map((item) => [item.pkg.name, item]));
  const dir = join(root, ".ci-packages");
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  const stageRoot = join(dir, ".stage");
  await fs.mkdir(stageRoot);
  const packed = new Map();
  for (const item of publicationOrder(packages)) {
    const staged = await stagePackage(item, byName, stageRoot);
    const manifest = await readJson(join(staged, "package.json"));
    for (const section of ["dependencies", "optionalDependencies"]) {
      for (const name of Object.keys(manifest[section] ?? {})) {
        const archive = packed.get(name);
        if (archive) manifest[section][name] = `file:${archive}`;
      }
    }
    await writeJson(join(staged, "package.json"), manifest);
    const response = JSON.parse(
      await run("npm", ["pack", staged, "--pack-destination", dir, "--json"]),
    );
    const file = response?.[0]?.filename;
    if (typeof file !== "string") throw new Error(`${item.pkg.name}: failed to pack local fixture`);
    packed.set(item.pkg.name, join(dir, file));
  }
  await fs.rm(stageRoot, { recursive: true, force: true });
  await writeJson(join(dir, "fixtures.json"), Object.fromEntries(packed));
  console.log(`Packed ${packed.size} local native fixtures.`);
}

if (command === "manifest") {
  await writeManifest(await buildManifest(await discoverPackages()));
} else if (command === "assets") {
  await assets();
} else if (command === "local-fixtures") {
  await localFixtures();
} else if (command === "version") {
  await version();
} else {
  throw new Error(
    "usage: node .github/scripts/release.mjs <manifest|assets|local-fixtures|version>",
  );
}
// jscpd:ignore-end
