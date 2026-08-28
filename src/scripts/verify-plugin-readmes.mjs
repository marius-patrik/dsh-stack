import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

const roots = [
  join(process.cwd(), "src/packages"),
  join(process.cwd(), "publish/extensions"),
  join(process.cwd(), "publish/packs"),
  join(process.cwd(), "publish/plugins"),
];
const missing = [];

/**
 * Inspects directories for the presence of a `package.json` and optionally a `README` file.
 *
 * Guarantees: Logs directories missing a `README` file if a `package.json` is found.
 * Returns: Undefined.
 * Fails: Ignores directories without a `package.json` or containing `node_modules` or `packs`.
 */
async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  const hasPackage = entries.some((entry) => entry.isFile() && entry.name === "package.json");
  if (hasPackage) {
    const hasReadme = entries.some(
      (entry) => entry.isFile() && /^README(?:\.[^.]*)?$/i.test(entry.name),
    );
    if (!hasReadme) missing.push(relative(process.cwd(), dir));
    return;
  }
  await Promise.all(
    entries
      .filter(
        (entry) => entry.isDirectory() && entry.name !== "node_modules" && entry.name !== "packs",
      )
      .map((entry) => walk(join(dir, entry.name))),
  );
}

await Promise.all(roots.map(walk));
missing.sort();
if (missing.length) {
  console.error(`Every package/plugin package must contain README.md. Missing ${missing.length}:`);
  for (const dir of missing) console.error(`- ${dir}/README.md`);
  process.exit(1);
}
console.log("All canonical packages and plugin-tree packages contain a README.");
