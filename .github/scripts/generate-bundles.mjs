/** Generate real DSH bundle patch layers by flattening nested composition dependencies. */
import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import { listBundlePackageDirs, readJson, root } from "./lib/repo-paths.mjs";

const check = process.argv.includes("--check");

/** Load bundle definitions with stable identity and validate native DSH manifest fields. */
async function definitions() {
  const catalog = new Map();
  for (const dir of await listBundlePackageDirs()) {
    const manifest = await readJson(join(dir, "package.json"));
    const name = manifest.name;
    if (typeof name !== "string" || !name.startsWith("@dsh-stack/"))
      throw new Error(`Invalid bundle identity: ${dir}`);
    if (catalog.has(name)) throw new Error(`Duplicate bundle name: ${name}`);
    if (manifest.dsh?.bundle?.patch !== "./dist/cordis.patch.yml") {
      throw new Error(
        `${name}: dsh.bundle.patch must point to the generated dist/cordis.patch.yml`,
      );
    }
    const compose = manifest.stack?.compose ?? [];
    if (!Array.isArray(compose) || compose.some((x) => typeof x !== "string"))
      throw new Error(`${name}: invalid stack.compose`);
    if (new Set(compose).size !== compose.length)
      throw new Error(`${name}: duplicate child bundle`);
    for (const child of compose)
      if (manifest.dependencies?.[child] === undefined)
        throw new Error(`${name}: missing dependency on ${child}`);
    catalog.set(name, { dir, manifest, compose });
  }
  return catalog;
}

/** Concatenate a native bundle's children before its own optional composition layer. */
async function compose(name, catalog) {
  const done = new Set();
  const active = new Set();
  const patches = [];
  const seenEntries = new Map();
  /** Traverse each bundle once, detecting dependency cycles and repeated Cordis entry IDs. */
  async function walk(current) {
    if (done.has(current)) return;
    if (active.has(current)) throw new Error(`Bundle composition cycle at ${current}`);
    const bundle = catalog.get(current);
    if (!bundle) throw new Error(`${name}: unknown bundle ${current}`);
    active.add(current);
    for (const child of bundle.compose) await walk(child);
    const source = join(bundle.dir, "composition", "cordis.patch.yml");
    try {
      const patch = await fs.readFile(source, "utf8");
      if (!patch.trim()) throw new Error(`${current}: empty source patch`);
      for (const m of patch.matchAll(/^    - id: ([A-Za-z0-9._-]+)\s*$/gm)) {
        const previous = seenEntries.get(m[1]);
        if (previous)
          throw new Error(`${name}: duplicate inserted row ${m[1]} in ${previous} and ${current}`);
        seenEntries.set(m[1], current);
      }
      patches.push(`# From ${current}\n${patch.trimEnd()}`);
    } catch (err) {
      if (err?.code !== "ENOENT") throw err;
    }
    active.delete(current);
    done.add(current);
  }
  await walk(name);
  return patches.length ? `${patches.join("\n\n")}\n` : "[]\n";
}

/** Generate or verify all deterministic DSH patch artifacts without changing profile state. */
async function main() {
  const catalog = await definitions();
  for (const [name, bundle] of catalog) {
    const expected = await compose(name, catalog);
    const target = join(bundle.dir, "dist", "cordis.patch.yml");
    if (check) {
      let existing;
      try {
        existing = await fs.readFile(target, "utf8");
      } catch {
        /* absent */
      }
      if (existing !== expected)
        throw new Error(`${name}: stale generated patch; run bundle generation`);
      continue;
    }
    await fs.mkdir(dirname(target), { recursive: true });
    await fs.writeFile(target, expected, "utf8");
  }
  console.log(`${check ? "Verified" : "Generated"} ${catalog.size} nested native bundle patches.`);
}

await main();
