/**
 * Publish one verified GitHub Release's native npm tarballs in dependency order.
 * This script never builds or changes a tarball: npm publishes the exact
 * SHA-verified release bytes, and refuses to overwrite a mismatched version.
 */
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const releaseDir = join(process.cwd(), ".release");
const registry = "https://registry.npmjs.org/";
const planOnly = process.argv.includes("--plan");

/** Read a release metadata document. */
async function document(name) {
  return JSON.parse(await readFile(join(releaseDir, name), "utf8"));
}

/** Validate the immutable release graph and sort prerequisites before parents. */
function publicationPlan(catalog, inventory) {
  if (catalog.format !== 3 || inventory.format !== 3) {
    throw new Error("Unexpected native release manifest format");
  }
  const declared = new Map(catalog.packages.map((item) => [item.name, item]));
  const archives = new Map(inventory.packages.map((item) => [item.name, item]));
  if (declared.size !== catalog.packages.length || archives.size !== inventory.packages.length ||
      declared.size !== archives.size) {
    throw new Error("Duplicate or incomplete native package inventory");
  }

  const ordered = [];
  const complete = new Set();
  const visiting = new Set();
  /** Resolve the package's local dependencies without relying on archive ordering. */
  function visit(name) {
    if (complete.has(name)) return;
    if (visiting.has(name)) throw new Error(`Native publication dependency cycle at ${name}`);
    const item = declared.get(name);
    const archive = archives.get(name);
    if (!item || !archive || archive.version !== item.version) {
      throw new Error(`Missing or version-mismatched release package: ${name}`);
    }
    if (!/^[a-zA-Z0-9_.-]+\.tgz$/.test(archive.file) || basename(archive.file) !== archive.file ||
        typeof archive.integrity !== "string" || !archive.integrity.startsWith("sha512-")) {
      throw new Error(`Unsafe archive reference or missing integrity: ${name}`);
    }
    visiting.add(name);
    for (const [dependency, version] of Object.entries({
      ...item.dependencies,
      ...item.optionalDependencies,
    })) {
      if (!dependency.startsWith("@dsh-stack/")) continue;
      const required = declared.get(dependency);
      if (!required || required.version !== version) {
        throw new Error(`${name}: invalid Stack dependency ${dependency}@${version}`);
      }
      visit(dependency);
    }
    visiting.delete(name);
    complete.add(name);
    ordered.push({ ...archive, path: join(releaseDir, archive.file) });
  }
  for (const name of [...declared.keys()].sort()) visit(name);
  return ordered;
}

/** Query the public registry; do not mistake authentication or network errors for absence. */
async function publishedIntegrity(name, version) {
  try {
    const { stdout } = await execFileAsync(
      "npm",
      ["view", `${name}@${version}`, "dist.integrity", "--json", "--registry", registry],
      { maxBuffer: 1024 * 1024 },
    );
    const parsed = JSON.parse(stdout);
    if (typeof parsed !== "string" || !parsed.startsWith("sha512-")) {
      throw new Error(`Invalid registry integrity for ${name}@${version}`);
    }
    return parsed;
  } catch (error) {
    const output = `${error?.stderr ?? ""}\n${error?.stdout ?? ""}`;
    if (/\bE404\b|404 Not Found/i.test(output)) return null;
    throw error;
  }
}

/** Verify every registry response against the npm pack integrity of the release asset. */
async function confirm(item, attempts = 1) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const current = await publishedIntegrity(item.name, item.version);
    if (current !== null) {
      if (current !== item.integrity) {
        throw new Error(`${item.name}@${item.version} exists with different bytes; refusing overwrite`);
      }
      return true;
    }
    if (attempt + 1 < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }
  return false;
}

/** Publish an absent package once, then confirm that npm serves the intended bytes. */
async function publish(item) {
  if (await confirm(item)) {
    console.log(`verified existing ${item.name}@${item.version}`);
    return;
  }
  console.log(`publishing ${item.name}@${item.version}`);
  await execFileAsync(
    "npm",
    ["publish", item.path, "--access", "public", "--tag", "latest", "--registry", registry],
    { maxBuffer: 1024 * 1024 * 8 },
  );
  if (!(await confirm(item, 6))) {
    throw new Error(`${item.name}@${item.version} is not visible in npm after publication`);
  }
  console.log(`verified new ${item.name}@${item.version}`);
}

const plan = publicationPlan(
  await document("stack-release.json"),
  await document("component-assets.json"),
);
console.log(`Native registry publication plan: ${plan.length} packages`);
if (planOnly) {
  for (const item of plan) console.log(`  ${item.name}@${item.version}`);
} else {
  for (const item of plan) await publish(item);
  console.log(`Published and verified ${plan.length} native packages on npm`);
}
