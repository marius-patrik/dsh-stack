import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const pluginsDir = join(root, "plugins");
const releaseDir = join(root, ".release");
const stageDir = join(releaseDir, ".stage");

/** Recursively discover component directories, including symlinked directories, by package manifest. */
async function discoverComponents(baseDir, relativePrefix = "") {
  const entries = await fs.readdir(baseDir, { withFileTypes: true });
  const components = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const dir = join(baseDir, entry.name);
    const relativePath = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
    let stat;
    try {
      stat = await fs.stat(dir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    try {
      const packageJson = JSON.parse(await fs.readFile(join(dir, "package.json"), "utf8"));
      components.push({ dir, relativePath, packageJson });
      continue;
    } catch {
      components.push(...(await discoverComponents(dir, relativePath)));
    }
  }
  return components.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/** Create one ZIP archive while dereferencing every symlink in the packaged component. */
async function createZip(component, kind) {
  const slug = component.relativePath.replaceAll("/", "-");
  const archive = join(releaseDir, `${kind}-${slug}.zip`);
  const staged = join(stageDir, kind, slug);
  await fs.mkdir(join(stageDir, kind), { recursive: true });
  await fs.cp(component.dir, staged, { recursive: true, dereference: true, force: true });
  await execFileAsync("zip", ["-qr", archive, "."], { cwd: staged });
  return relative(releaseDir, archive);
}

/** Build one ZIP asset for every plugin and every pack and publish the component inventory. */
async function main() {
  await fs.mkdir(releaseDir, { recursive: true });
  await fs.rm(stageDir, { recursive: true, force: true });
  await fs.mkdir(stageDir, { recursive: true });

  const allPlugins = await discoverComponents(pluginsDir);
  const plugins = allPlugins.filter((component) => !component.relativePath.startsWith("packs/"));
  const packs = await discoverComponents(join(pluginsDir, "packs"));

  const pluginAssets = [];
  const packAssets = [];
  for (const component of plugins) pluginAssets.push(await createZip(component, "plugin"));
  for (const component of packs) packAssets.push(await createZip(component, "pack"));

  const inventory = {
    format: 1,
    plugins: pluginAssets,
    packs: packAssets,
    total: pluginAssets.length + packAssets.length,
  };
  await fs.writeFile(
    join(releaseDir, "component-assets.json"),
    `${JSON.stringify(inventory, null, 2)}\n`,
    "utf8",
  );

  const files = (await fs.readdir(releaseDir)).filter((file) => !file.startsWith(".")).sort();
  const checksums = [];
  for (const file of files) {
    const digest = createHash("sha256")
      .update(await fs.readFile(join(releaseDir, file)))
      .digest("hex");
    checksums.push(`${digest}  ${file}`);
  }
  await fs.writeFile(join(releaseDir, "SHA256SUMS"), `${checksums.join("\n")}\n`, "utf8");

  await fs.rm(stageDir, { recursive: true, force: true });
  console.log(`Generated ${pluginAssets.length} plugin ZIPs and ${packAssets.length} pack ZIPs.`);
}

await main();
