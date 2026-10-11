import { promises as fs } from "node:fs";
import { join, basename } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { listPluginPackageDirs, listBundlePackageDirs } from "./lib/repo-paths.mjs";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const releaseDir = join(root, ".release");

/** Compute expected published asset inventory from native source packages. */
async function expectedPackages() {
  const dirs = [...(await listPluginPackageDirs()), ...(await listBundlePackageDirs())];
  return (
    await Promise.all(
      dirs.map(async (dir) => {
        const manifest = JSON.parse(await fs.readFile(join(dir, "package.json"), "utf8"));
        return manifest.private ? null : manifest.name;
      }),
    )
  )
    .filter(Boolean)
    .sort();
}

/** Verify each ZIP and its root package.json. */
async function verifyArchive(archive) {
  await execFileAsync("unzip", ["-t", archive]);
  const { stdout } = await execFileAsync("unzip", ["-Z1", archive]);
  if (!stdout.split("\n").includes("package.json"))
    throw new Error(`Missing package.json: ${archive}`);
}

/** Validate assets and cross-check manifest versions with archives. */
async function main() {
  const inventory = JSON.parse(
    await fs.readFile(join(releaseDir, "component-assets.json"), "utf8"),
  );
  if (!Array.isArray(inventory.plugins)) throw new Error("Invalid component-assets.json");
  const expected = await expectedPackages();
  const manifest = JSON.parse(await fs.readFile(join(releaseDir, "stack-release.json"), "utf8"));
  const actual = manifest.packages.map((pkg) => pkg.name).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Release inventory mismatch: expected ${expected.length}, found ${actual.length}`,
    );
  }
  for (const file of inventory.plugins) {
    const archive = join(releaseDir, file);
    if (!(await fs.stat(archive)).isFile()) throw new Error(`Not an asset: ${file}`);
    await verifyArchive(archive);
  }
  if (inventory.plugins.length !== expected.length) throw new Error("Missing package archives");
  console.log(`Validated ${expected.length} native Stack release archives.`);
}

await main();
