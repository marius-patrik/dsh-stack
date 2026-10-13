/** Verify that every native release artifact exists and matches the package catalog. */
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  listPluginPackageDirs,
  listBundlePackageDirs,
  readJson,
  root,
} from "../../packages/stack/plugin-kit/tooling/repo-paths.mjs";

const run = promisify(execFile);
const dir = join(root, ".release");

/** Count all publishable packages from their canonical manifests. */
async function expectedNames() {
  const dirs = [...(await listPluginPackageDirs()), ...(await listBundlePackageDirs())];
  const names = [];
  for (const path of dirs) {
    const pkg = await readJson(join(path, "package.json"));
    if (!pkg.private) names.push(pkg.name);
  }
  return names.sort();
}

/** Validate that the published inventory is complete and npm artifacts are readable. */
async function main() {
  const catalog = await readJson(join(dir, "stack-release.json"));
  const assets = await readJson(join(dir, "component-assets.json"));
  if (catalog.format !== 3 || assets.format !== 3) throw new Error("Unexpected release format");
  const expected = await expectedNames();
  const actual = catalog.packages.map((p) => p.name).sort();
  if (JSON.stringify(expected) !== JSON.stringify(actual))
    throw new Error("Incomplete native release manifest");
  const archived = assets.packages.map((p) => p.name).sort();
  if (JSON.stringify(expected) !== JSON.stringify(archived))
    throw new Error("Incomplete native npm archives");
  for (const item of assets.packages) {
    const path = join(dir, item.file);
    if (!(await fs.stat(path)).isFile()) throw new Error(`Missing package archive: ${item.file}`);
    const { stdout } = await run("tar", ["-tzf", path]);
    if (!stdout.split("\n").includes("package/package.json"))
      throw new Error(`No npm package.json: ${item.file}`);
    if (
      catalog.packages.find((p) => p.name === item.name)?.bundle &&
      !stdout.split("\n").includes("package/dist/cordis.patch.yml")
    ) {
      throw new Error(`Missing native bundle patch: ${item.name}`);
    }
  }
  console.log(`Verified ${expected.length} native npm package archives.`);
}

await main();
