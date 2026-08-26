// jscpd:ignore-start -- shared release-tooling boilerplate (module header), intentionally mirrored across scripts/*.mjs
/**
 * Generates `publish/packs/bundle/cordis.patch.yml` from the Stack's own
 * pack composition, so the harness-bootable dsh.bundle for the complete
 * Stack is derived from the real, buildable pack dependency graph rather
 * than hand-maintained.
 *
 * "The complete Stack" (this generator's design choice) is the union of
 * every concrete plugin/extension package reachable from the seven domain
 * packs under `publish/packs/` (`ai`, `core`, `ux`, `integrations`,
 * `agents`, `trading`, `vcs`) -- i.e. every pack a Stack profile currently
 * composes -- FILTERED to the packages that actually have the cordis
 * loader shape (a built `lib/index.js` exporting a function, or an object
 * with a function `apply`; per `src/scripts/plugin-check-kit.mjs`'s
 * `assertLoaderShape`). Not every package in that union is a cordis row:
 * `stack.kind === "library"` plumbing (e.g. `@dsh-stack/plugin-kit`) and
 * packages with no host entry export no `apply` and are excluded here
 * rather than mounted. Browser-only UI packages are NOT excluded on those
 * grounds: the client-modules scanner (`harness` `dsh-client-modules`)
 * discovers `dsh.client` bundles only from mounted loader entries, so every
 * package declaring `dsh.client` carries a no-op host `apply` (the same
 * convention as the harness's own `dsh-client-ui-*` packages) and appears
 * here as a row.
 *
 * Run with `check` to verify the checked-in file is up to date instead of
 * rewriting it (used by the bundle pack's `verify` script). Both modes
 * require every candidate package's `lib/` to already be built (`pnpm
 * build` upstream of this script), so the loader-shape probe reflects
 * real built output, not source guesswork.
 */
import { promises as fs } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** hasLoaderShape implementation. */
async function hasLoaderShape(packageDir, mainRelativePath) {
  const entryPath = join(packageDir, mainRelativePath ?? "lib/index.js");
  let mod;
  try {
    mod = await import(pathToFileURL(entryPath).href);
  } catch {
    return false;
  }
  if (typeof mod.apply === "function") return typeof mod.name === "string" && mod.default === undefined;
  if (mod.default && typeof mod.default === "object" && typeof mod.default.apply === "function") return true;
  return false;
}

const mode = process.argv[2] ?? "write";
if (!["write", "check"].includes(mode)) {
  console.error("usage: node generate-stack-bundle-patch.mjs <write|check>");
  process.exit(2);
}

const scriptDir = new URL(".", import.meta.url).pathname;
const repositoryRoot = resolve(scriptDir, "..", "..");
const packsRoot = join(repositoryRoot, "publish", "packs");
const domainPackNames = ["ai", "core", "ux", "integrations", "agents", "trading", "vcs"];
const outputPath = join(repositoryRoot, "publish", "packs", "bundle", "cordis.patch.yml");

/**
 * Packages with a real cordis loader shape (they pass {@link hasLoaderShape})
 * that still cannot be mounted as a bare `insert` row in this bundle, each
 * for its own documented reason. Reconciling these is real follow-up scope
 * -- architecture questions this generator cannot resolve on its own --
 * tracked in the issue this bundle pack's introducing PR links.
 *
 * - `@dsh-stack/agent-skills` registers the `SkillRegistry` cordis service
 *   under the same key `@deepseek-ai/dsh-skill` (mounted by every profile's
 *   `dsh-base` layer, see `harness/packages/bundle/base/cordis.patch.yml`)
 *   already provides, so mounting both aborts the boot with `service
 *   "skills" has been registered`. Does `@dsh-stack/agent-skills` replace
 *   the base row, extend it, or need a distinct service key?
 * - `@dsh-stack/agent-commands` and `@dsh-stack/agent-personas` both
 *   `inject: ["slots", ...]` a host-side cordis service named `slots` that
 *   no package anywhere in the harness or the Stack registers on the host
 *   (`slots` is a *client*-side browser concept, `@deepseek-ai/dsh-client-ui-slots`,
 *   not a cordis host service) -- boot never activates them: `dsh: entries
 *   did not activate ... waiting for service: slots`. This looks like a
 *   defect in the two packages' own host-side `inject` declarations rather
 *   than something the bundle can route around.
 */
const KNOWN_CORDIS_MOUNT_INCOMPATIBILITIES = new Set([
  "@dsh-stack/agent-skills",
  "@dsh-stack/agent-commands",
  "@dsh-stack/agent-personas",
]);

/** readJson implementation. */
async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

/** discoverStackPackages implementation. */
async function discoverStackPackages() {
  const byName = new Map();
  for (const catalogRoot of ["src/packages", "publish/extensions"]) {
    const catalogDir = join(repositoryRoot, catalogRoot);
    const entries = await fs.readdir(catalogDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
      const dir = join(catalogDir, entry.name);
      try {
        const manifest = await readJson(join(dir, "package.json"));
        if (typeof manifest.name === "string") byName.set(manifest.name, { dir, manifest });
      } catch {
        // not every entry is a package (e.g. stray files); skip silently.
      }
    }
  }
  return byName;
}

/** collectMountablePackageNames implementation. */
async function collectMountablePackageNames() {
  const byName = await discoverStackPackages();
  const union = new Set();
  for (const packName of domainPackNames) {
    const packManifest = await readJson(join(packsRoot, packName, "package.json"));
    for (const dependencyName of Object.keys(packManifest.dependencies ?? {})) union.add(dependencyName);
  }

  const mountable = [];
  const skipped = [];
  for (const name of union) {
    const found = byName.get(name);
    if (!found) throw new Error(`Stack bundle: unresolved pack dependency ${name}`);
    const { dir, manifest } = found;
    const kind = manifest.stack?.kind;
    if (kind !== "plugin" && kind !== "extension") continue;
    if (KNOWN_CORDIS_MOUNT_INCOMPATIBILITIES.has(name)) {
      skipped.push(`${name} (known cordis mount incompatibility, see KNOWN_CORDIS_MOUNT_INCOMPATIBILITIES)`);
      continue;
    }
    if (await hasLoaderShape(dir, manifest.main)) mountable.push(name);
    else skipped.push(name);
  }
  mountable.sort((a, b) => a.localeCompare(b));
  skipped.sort((a, b) => a.localeCompare(b));
  return { mountable, skipped };
}

/** rowIdFor implementation. */
function rowIdFor(packageName) {
  return packageName.replace(/^@dsh-stack\//, "").replaceAll("/", "-");
}

/** renderPatch implementation. */
function renderPatch(packageNames) {
  const header = [
    "# GENERATED FILE -- do not hand-edit.",
    "#",
    `# Produced by \`node src/scripts/generate-stack-bundle-patch.mjs write\` from the`,
    "# union of every plugin/extension package the seven domain packs under",
    "# publish/packs/ (ai, core, ux, integrations, agents, trading, vcs) depend on --",
    "# i.e. the complete dsh-stack catalog. Regenerate after any pack dependency",
    "# change; `pnpm --filter @dsh-stack/pack-bundle run verify` fails loud on drift.",
    "#",
    "# Each row's `name` is a PACKAGE NAME resolved through the profile's own",
    "# node_modules (pnpm installs this bundle's full dependency closure there),",
    "# not a filesystem path. Row `id`s are derived from the package name so a",
    "# later `dsh plugin` inspection can trace a mounted row back to its source.",
    "",
  ].join("\n");

  // `name:` values are quoted: a bare `@dsh-stack/...` scalar starts with
  // YAML's reserved `@` indicator character and fails to parse unquoted.
  const rows = packageNames
    .map((name) => `    - id: ${rowIdFor(name)}\n      name: '${name}'`)
    .join("\n");

  return `${header}- insert:\n${rows}\n`;
}

const { mountable, skipped } = await collectMountablePackageNames();
const content = renderPatch(mountable);

if (mode === "check") {
  let existing;
  try {
    existing = await fs.readFile(outputPath, "utf8");
  } catch {
    existing = undefined;
  }
  if (existing !== content) {
    console.error(
      `publish/packs/bundle/cordis.patch.yml is stale (${mountable.length} mountable plugins expected). ` +
        "Run `node src/scripts/generate-stack-bundle-patch.mjs write` to regenerate.",
    );
    process.exit(1);
  }
  console.log(
    `publish/packs/bundle/cordis.patch.yml is up to date: ${mountable.length} mountable plugins, ` +
      `${skipped.length} client-only/non-cordis packages excluded.`,
  );
} else {
  await fs.writeFile(outputPath, content);
  console.log(
    `Wrote publish/packs/bundle/cordis.patch.yml: ${mountable.length} mountable plugins ` +
      `(excluded as non-cordis: ${skipped.join(", ") || "none"}).`,
  );
}

// jscpd:ignore-end
