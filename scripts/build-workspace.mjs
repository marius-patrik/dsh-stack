/**
 * Build the Stack workspace in declared dependency order.
 *
 * Parallel independent package builds are safe, but compiling every package
 * concurrently races TypeScript declaration emission for local workspace peers.
 */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { listPluginPackageDirs, listBundlePackageDirs, readJson, root } from "./lib/repo-paths.mjs";

const concurrency = Math.max(1, Number(process.env.DSH_BUILD_PARALLELISM ?? "6"));

/** Discover buildable packages and their locally declared dependency edges. */
async function discover() {
  const dirs = [...(await listPluginPackageDirs()), ...(await listBundlePackageDirs())];
  const packages = new Map();
  for (const dir of dirs) {
    const pkg = await readJson(join(dir, "package.json"));
    if (packages.has(pkg.name)) throw new Error(`Duplicate workspace package: ${pkg.name}`);
    packages.set(pkg.name, {
      dir,
      name: pkg.name,
      build: typeof pkg.scripts?.build === "string",
      references: new Set([
        ...Object.keys(pkg.dependencies ?? {}),
        ...Object.keys(pkg.optionalDependencies ?? {}),
        ...Object.entries(pkg.peerDependencies ?? {})
          .filter(([, version]) => String(version).startsWith("workspace:"))
          .map(([name]) => name),
      ]),
      downstream: [],
      pending: 0,
    });
  }
  for (const pkg of packages.values()) {
    for (const dependency of pkg.references) {
      const upstream = packages.get(dependency);
      if (!upstream) {
        if (dependency.startsWith("@dsh-stack/"))
          throw new Error(`${pkg.name}: local dependency not found: ${dependency}`);
        continue;
      }
      upstream.downstream.push(pkg);
      pkg.pending++;
    }
  }
  return packages;
}

/** Spawn a package's own build command and propagate its exit status. */
async function build(pkg) {
  if (!pkg.build) return;
  await new Promise((resolve, reject) => {
    const child = spawn("bun", ["run", "build"], { cwd: pkg.dir, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${pkg.name}: build exited ${code ?? signal}`));
    });
  });
}

/** Dispatch ready graph vertices concurrently while respecting package prerequisites. */
async function main() {
  if (!Number.isInteger(concurrency) || concurrency < 1)
    throw new Error("DSH_BUILD_PARALLELISM must be a positive integer");
  const nodes = await discover();
  const ready = [...nodes.values()].filter((node) => node.pending === 0).sort((a, b) => a.name.localeCompare(b.name));
  let inFlight = 0;
  let complete = 0;
  let rejected;
  await new Promise((resolve, reject) => {
    /** Execute the next ready nodes, completing descendants only after prerequisite builds. */
    function dispatch() {
      while (!rejected && inFlight < concurrency && ready.length) {
        const pkg = ready.shift();
        inFlight++;
        build(pkg).then(() => {
          complete++;
          for (const next of pkg.downstream) {
            next.pending--;
            if (next.pending === 0) {
              ready.push(next);
              ready.sort((a, b) => a.name.localeCompare(b.name));
            }
          }
        }).catch((error) => {
          rejected ??= error;
        }).finally(() => {
          inFlight--;
          if (inFlight === 0 && rejected) reject(rejected);
          else if (inFlight === 0 && ready.length === 0) {
            if (complete !== nodes.size)
              reject(new Error(`Workspace dependency cycle: ${nodes.size - complete} unresolved packages`));
            else resolve();
          } else dispatch();
        });
      }
    }
    dispatch();
  });
  console.log(`Built ${complete} workspace packages with dependency-aware parallelism ${concurrency}.`);
}

await main();
