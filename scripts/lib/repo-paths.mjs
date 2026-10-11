/** Shared discovery for flat Stack plugins and arbitrarily nested bundle packages. */
import { promises as fs } from "node:fs";
import { join } from "node:path";

export const root = process.cwd();

/** Read a UTF-8 JSON file. */
export async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

/** List one package at each immediate child of the flat plugins directory. */
export async function listPluginPackageDirs() {
  const base = join(root, "plugins");
  const dirs = [];
  for (const entry of await fs.readdir(base, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "Memory") continue;
    const dir = join(base, entry.name);
    try {
      await fs.access(join(dir, "package.json"));
      dirs.push(dir);
    } catch {
      throw new Error(`plugins/${entry.name} is not a flat package`);
    }
  }
  return dirs.sort();
}

/** Discover publishable nested bundle leaf directories without prescribing nesting depth. */
export async function listBundlePackageDirs() {
  const base = join(root, "bundles");
  const result = [];
  async function visit(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch (error) { if (dir === base && error?.code === "ENOENT") return; throw error; }
    if (entries.some((entry) => entry.isFile() && entry.name === "package.json")) {
      result.push(dir);
      return;
    }
    for (const entry of entries) if (entry.isDirectory() && !entry.name.startsWith(".")) await visit(join(dir, entry.name));
  }
  await visit(base);
  return result.sort();
}
