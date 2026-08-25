import { promises as fs } from "node:fs";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";

const command = process.argv[2];
if (!["build", "typecheck", "test", "verify"].includes(command)) {
  console.error("usage: node pack.mjs <build|typecheck|test|verify>");
  process.exit(2);
}

const root = process.cwd();
const workspace = resolve(root, "..");

/** readJson implementation. */
async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

/** discoverStackPackages implementation. */
async function discoverStackPackages() {
  const entries = await fs.readdir(workspace, { withFileTypes: true });
  const byId = new Map();
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const dir = join(workspace, entry.name);
    try {
      const manifest = await readJson(join(dir, "stack.json"));
      if (typeof manifest.id === "string") byId.set(manifest.id, { dir, manifest });
    } catch {}
  }
  return byId;
}

const stack = await readJson(join(root, "stack.json"));
const packages = await discoverStackPackages();
const dependencyIds = Array.isArray(stack.dependencies) ? stack.dependencies : [];
const dependencies = dependencyIds.map((id) => {
  const found = packages.get(id);
  if (!found) throw new Error(`Pack ${stack.id} references missing Stack package ${id}`);
  return { id, ...found };
});

dependencies.sort((a, b) => a.id.localeCompare(b.id));

const /** run implementation. */
run = (child) =>
  new Promise((resolvePromise, reject) => {
    const childProcess = spawn("pnpm", ["run", command], {
      cwd: child.dir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    childProcess.on("error", reject);
    childProcess.on("exit", (code, signal) => {
      if (signal) reject(new Error(`${child.id} ${command} terminated by ${signal}`));
      else if (code === 0) resolvePromise();
      else reject(new Error(`${child.id} ${command} exited with ${code}`));
    });
  });

for (const dependency of dependencies) await run(dependency);
console.log(`${command}: ${dependencies.length} Stack dependencies`);
