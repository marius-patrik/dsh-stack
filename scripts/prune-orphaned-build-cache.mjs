/** Remove only stale compiler output resurrected by GitHub Actions cache restore.
 *
 * TS cache restore keys span package moves, so a previous path can be restored
 * as a package.json-less directory containing only lib/ and *.tsbuildinfo.
 * Never hide a malformed checkout directory containing real source.
 */
import { promises as fs } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const cacheNames = new Set(["lib", "dist", "node_modules", ".turbo", ".next"]);
const skipNames = new Set(["node_modules", "dsh-tui", ".git"]);
let removed = 0;

/** Identify files that can only originate from dependency or compiler caches. */
function isCacheArtifact(entry) {
  return cacheNames.has(entry.name) || entry.name.endsWith(".tsbuildinfo");
}

/** Prune a cache-only orphan; leave every source-bearing directory intact. */
async function visit(path) {
  const entries = await fs.readdir(path, { withFileTypes: true });
  if (entries.length > 0 && entries.every(isCacheArtifact)) {
    await fs.rm(path, { recursive: true, force: true });
    console.log(`Pruned orphaned compiler cache: ${relative(root, path)}`);
    removed++;
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory() && !skipNames.has(entry.name) && !isCacheArtifact(entry)) {
      await visit(join(path, entry.name));
    }
  }
}

await visit(join(root, "plugins"));
console.log(`Orphan compiler cache prune complete: ${removed} directories removed.`);
