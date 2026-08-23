import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const packagesDir = join(root, "packages");
const pluginsDir = join(root, "plugins");
const codeExts = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]);
const ignoredDirs = new Set(["node_modules", ".git", "dist", "coverage", "lib"]);
const generatedFileNames = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock"]);
const errors = [];
const packageNames = new Map();
const stackIds = new Map();
const publicPackages = new Map();
const sourceHashes = new Map();

function fail(message) {
  errors.push(message);
}
function assert(condition, message) {
  if (!condition) fail(message);
}

async function readJson(path, label) {
  try {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
    return undefined;
  }
}

async function exists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

async function trackedGeneratedFiles() {
  try {
    const { stdout } = await execFileAsync(
      "git",
      [
        "ls-files",
        "--",
        "packages/**/lib/**",
        "packages/**/dist/**",
        "packages/**/node_modules/**",
        "plugins/**/lib/**",
        "plugins/**/dist/**",
        "plugins/**/node_modules/**",
      ],
      { cwd: root },
    );
    return stdout
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  } catch (error) {
    fail(`unable to inspect tracked generated files: ${error.message}`);
    return [];
  }
}

async function verifyCanonicalPackage(dir) {
  const relDir = relative(root, dir);
  const packagePath = join(dir, "package.json");
  const stackPath = join(dir, "stack.json");
  const packageManifest = await readJson(packagePath, relative(root, packagePath));
  assert(packageManifest?.type === "module", `${relative(root, packagePath)} must use ESM`);
  assert(
    typeof packageManifest?.name === "string" && packageManifest.name.length > 0,
    `${relative(root, packagePath)} must declare a package name`,
  );

  if (packageManifest?.name) {
    const previous = packageNames.get(packageManifest.name);
    if (previous)
      fail(
        `duplicate package name ${packageManifest.name}: ${previous} and ${relative(root, packagePath)}`,
      );
    else packageNames.set(packageManifest.name, relative(root, packagePath));
  }

  const stack = await readJson(stackPath, relative(root, stackPath));
  if (packageManifest?.private === true) {
    assert(!stack, `${relative(root, packagePath)} is private and must not publish stack.json`);
    return;
  }

  assert(stack, `${relDir} must declare stack.json`);
  if (!stack) return;

  const label = relative(root, stackPath);
  if (typeof stack.id === "string") {
    const previous = stackIds.get(stack.id);
    if (previous) fail(`duplicate Stack id ${stack.id}: ${previous} and ${label}`);
    else stackIds.set(stack.id, label);
  }
  publicPackages.set(stack.id, { dir, stack });

  assert(
    typeof stack.id === "string" && /^stack\.[a-z0-9][a-z0-9.-]*$/.test(stack.id),
    `${label} id must be namespaced`,
  );
  assert(["plugin", "pack", "library"].includes(stack.kind), `${label} has invalid kind`);
  assert(
    typeof stack.version === "string" && /^\d+\.\d+\.\d+$/.test(stack.version),
    `${label} must have a semver version`,
  );
  assert(
    typeof stack.name === "string" && /^@dsh-stack\//.test(stack.name),
    `${label} must have an @dsh-stack package name`,
  );
  assert(
    typeof stack.description === "string" && stack.description.length > 0,
    `${label} must have a description`,
  );
  assert(
    Array.isArray(stack.files) && stack.files.length > 0,
    `${label} must declare published files`,
  );
  assert(Array.isArray(stack.dependencies ?? []), `${label} dependencies must be an array`);
  assert(
    Array.isArray(stack.optionalDependencies ?? []),
    `${label} optionalDependencies must be an array`,
  );
  if (stack.kind === "plugin")
    assert(await exists(join(dir, "src")), `${label} declares a plugin but has no src/ directory`);
  assert(
    packageManifest?.stack?.id === stack.id,
    `${relative(root, packagePath)} stack.id does not match stack.json`,
  );

  for (const publishedPath of stack.files) {
    if (
      generatedFileNames.has(publishedPath) ||
      publishedPath === "lib" ||
      publishedPath === "dist"
    )
      continue;
    assert(
      await exists(join(dir, publishedPath)),
      `${stack.id} publishes missing path ${publishedPath}`,
    );
  }
}

async function verifyPluginTree() {
  const children = await fs.readdir(pluginsDir, { withFileTypes: true });
  for (const child of children) {
    if (!child.isDirectory() || child.name === "packs") continue;
    const dir = join(pluginsDir, child.name);
    const packagePath = join(dir, "package.json");
    if (!(await exists(packagePath))) continue;
    const manifest = await readJson(packagePath, relative(root, packagePath));
    assert(
      manifest?.private === true,
      `${relative(root, packagePath)} must be a private composition wrapper`,
    );
    assert(manifest?.type === "module", `${relative(root, packagePath)} must use ESM`);
    assert(
      await exists(join(dir, "src", "index.mjs")),
      `${relative(root, dir)} must import its canonical package through src/index.mjs`,
    );
    const source = await fs.readFile(join(dir, "src", "index.mjs"), "utf8");
    assert(
      source.includes("../../../packages/"),
      `${relative(root, dir)}/src/index.mjs must resolve its canonical package through packages/`,
    );
  }
}

async function main() {
  assert(await exists(packagesDir), "packages/ canonical implementation root is missing");
  assert(await exists(pluginsDir), "plugins/ composition root is missing");
  for (const file of await trackedGeneratedFiles()) fail(`${file} is checked-in generated output`);

  const packageChildren = await fs.readdir(packagesDir, { withFileTypes: true });
  for (const child of packageChildren) {
    if (!child.isDirectory() || ignoredDirs.has(child.name)) continue;
    assert(
      await exists(join(packagesDir, child.name, "package.json")),
      `packages/${child.name} must contain package.json`,
    );
    await verifyCanonicalPackage(join(packagesDir, child.name));
  }

  await verifyPluginTree();

  for (const [id, { stack }] of publicPackages) {
    for (const dependency of [
      ...(stack.dependencies ?? []),
      ...(stack.optionalDependencies ?? []),
    ]) {
      assert(
        typeof dependency === "string" && publicPackages.has(dependency),
        `${id} references missing Stack package ${String(dependency)}`,
      );
    }
  }

  for await (const file of walk(packagesDir)) {
    const rel = relative(root, file).replaceAll("\\", "/");
    const ext = rel.slice(rel.lastIndexOf("."));
    if (!codeExts.has(ext)) continue;
    const text = await fs.readFile(file, "utf8");
    const lower = text.toLowerCase();
    for (const marker of ["todo", "fixme", "not implemented", "initialized: true"])
      assert(!lower.includes(marker), `${rel} contains unfinished or placeholder marker ${marker}`);
    assert(!/\bas any\b/.test(text), `${rel} contains an unchecked 'as any' cast`);
    assert(
      !/(?:from\s+|import\s*\()(['"]).*plugins\//.test(text),
      `${rel} imports implementation code from plugins/`,
    );
    if (text.length < 400) continue;
    const hash = createHash("sha256").update(text).digest("hex");
    const previous = sourceHashes.get(hash);
    if (previous && !/\/fixtures\/|\/snapshots\//.test(rel) && !/\/index\.(js|mjs|ts)$/.test(rel))
      fail(`duplicate source implementation: ${previous} and ${rel}`);
    else if (!previous) sourceHashes.set(hash, rel);
  }

  assert(publicPackages.size > 0, "no canonical Stack packages found");
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    `Stack verification passed: ${publicPackages.size} public packages, ${packageNames.size} canonical manifests, ${sourceHashes.size} unique implementation source bodies.`,
  );
}

await main();
