/** Discover native Stack package roots in the single physical plugin composition tree.
 * Nested packages remain independently publishable: a package.json does not
 * terminate discovery, because child bundles and plugins may live below it.
 */
import { promises as fs } from "node:fs";
import { join } from "node:path";

export const root = process.cwd();
const pluginsRoot = join(root, "plugins");
const ignored = new Set(["node_modules", ".git", "lib", "dist", "coverage", "dsh-tui"]);

/** Read a UTF-8 JSON file. */
export async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

/** Find all native packages, leaving external submodules and generated output alone. */
export async function listCompositionPackageDirs() {
  const result = [];
  /** Recurse even when the current directory is itself an npm package. */
  async function visit(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    if (entries.some((entry) => entry.isFile() && entry.name === "package.json"))
      result.push(dir);
    for (const entry of entries) {
      if (entry.isDirectory() && !ignored.has(entry.name) && !entry.name.startsWith("."))
        await visit(join(dir, entry.name));
    }
  }
  await visit(pluginsRoot);
  return result.sort();
}

/** Enumerate canonical Stack implementations and libraries, excluding native bundles and profile templates. */
export async function listPluginPackageDirs() {
  const result = [];
  for (const dir of await listCompositionPackageDirs()) {
    const pkg = await readJson(join(dir, "package.json"));
    if (!pkg.dsh?.bundle && !pkg.dsh?.profile) result.push(dir);
  }
  return result;
}

/** Find composition packages by native dsh.bundle.patch rather than directory depth. */
export async function listBundlePackageDirs() {
  const result = [];
  for (const dir of await listCompositionPackageDirs()) {
    const pkg = await readJson(join(dir, "package.json"));
    if (pkg.dsh?.bundle) result.push(dir);
  }
  return result;
}
