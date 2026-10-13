/** Remove only stale compiler output resurrected by GitHub Actions cache restore.
 *
 * TS cache restore keys span package moves, so a previous path can be restored
 * as a package.json-less directory containing only lib/ and *.tsbuildinfo.
 * Never hide a malformed checkout directory containing real source.
 */
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const cacheNames = new Set(["lib", "dist", "tsconfig.tsbuildinfo"]);
const skipNames = new Set(["node_modules", "dsh-tui", ".git"]);
let removed = 0;

/** Prune a cache-only orphan; leave every source-bearing directory intact. */
async function visit(path) {
  const entries = await fs.readdir(path, { withFileTypes: true });
  if (entries.length > 0 && entries.every((entry) => cacheNames.has(entry.name))) {
    await fs.rm(path, { recursive: true, force: true });
    console.log(`Pruned orphaned compiler cache: ${relative(root, path)}`);
    removed++;
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !skipNames.has(entry.name) && !cacheNames.has(entry.name)) {
      await visit(join(path, entry.name));
    }
  }
}

await visit(join(root, "plugins"));
console.log(`Orphan compiler cache prune complete: ${removed} directories removed.`);
