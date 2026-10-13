/** One-shot native version bump after the physical package source tree relocation.
 * Published npm package versions are immutable: even changing only
 * repository.directory changes tarball bytes and therefore requires a new version.
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import {
  listPluginPackageDirs,
  listBundlePackageDirs,
  readJson,
  root,
} from "./lib/repo-paths.mjs";

const dirs = [...await listPluginPackageDirs(), ...await listBundlePackageDirs()];
if (dirs.length !== 91) throw new Error(`Expected 91 native packages, got ${dirs.length}`);
const versions = new Map();
let legacyCount = 0;

/** Compute the next patch release without changing major or minor compatibility. */
function nextPatch(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) throw new Error(`Unexpected native package semver: ${version}`);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

/** Write a human-readable, reproducible package manifest. */
async function writeJson(path, value) {
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

for (const dir of dirs.sort()) {
  const path = join(dir, "package.json");
  const pkg = await readJson(path);
  if (!pkg.name?.startsWith("@dsh-stack/") || pkg.private === true)
    throw new Error(`Unexpected native package: ${path}`);
  if (versions.has(pkg.name)) throw new Error(`Duplicate native package: ${pkg.name}`);
  const previous = pkg.version;
  const next = nextPatch(previous);
  pkg.version = next;
  await writeJson(path, pkg);
  versions.set(pkg.name, { previous, next });

  const oldPath = join(dir, "stack.json");
  try {
    const legacy = await readJson(oldPath);
    if (legacy.version !== previous)
      throw new Error(`${pkg.name}: legacy version ${legacy.version} differs from ${previous}`);
    legacy.version = next;
    await writeJson(oldPath, legacy);
    legacyCount++;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}
if (versions.size !== 91 || legacyCount !== 78)
  throw new Error(`Package inventory discrepancy: ${versions.size} manifests, ${legacyCount} stack.json`);

for (const [name, version] of versions) {
  console.log(`${name}: ${version.previous} -> ${version.next}`);
}
console.log(`Bumped ${versions.size} native packages and ${legacyCount} legacy manifests.`);
