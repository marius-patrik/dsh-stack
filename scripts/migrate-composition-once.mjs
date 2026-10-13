/**
 * One-shot path repair for the 2026-10 native composition-tree migration.
 * Executed on a GitHub Actions checkout that has origin/main available.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

const source = execFileSync("git", ["ls-tree", "-r", "--name-only", "origin/main"], { encoding: "utf8" }).trim().split("\n");
const oldFiles = new Set(source);
const oldDirs = new Set([""]);
for (const file of source) {
  let current = dirname(file);
  while (current !== "." && !oldDirs.has(current)) {
    oldDirs.add(current);
    current = dirname(current);
  }
}
const groups = {
  agents: "agents", dialects: "ai/providers", "credential-vault": "ai/providers",
  providers: "ai/providers", tweaks: "ai/providers",
  formatters: "integrations/formatters", hosts: "integrations/hosts", lsp: "integrations/lsp",
  themes: "ux/themes", voice: "ux/voice",
};
const direct = new Set("agent-actions loops tools dialect-antigravity dialect-claude dialect-code-assist dialect-openai directory-picker-fix icon-engine marketplace marketplace-source-dsh-stack profile-ui repos sidebar-preferences sidebar-settings sidebar-shell skin-host skin-runtime skin-settings translator tweak-drag-drop tweak-fork-undo tweak-keybinds tweak-plan-toggle tweak-share-links tweak-slash-commands tweak-stats".split(" "));
const prefix = {
  "bundles/stack": "composition/stack",
  "bundles/headless": "composition/headless",
  "bundles/agents/all": "composition/stack/agents",
  "bundles/ai/all": "composition/stack/ai",
  "bundles/ai/providers": "composition/stack/ai/providers",
  "bundles/integrations/all": "composition/stack/integrations",
  "bundles/integrations/formatters": "composition/stack/integrations/formatters",
  "bundles/integrations/hosts": "composition/stack/integrations/hosts",
  "bundles/integrations/lsp": "composition/stack/integrations/lsp",
  "bundles/ux/all": "composition/stack/ux",
  "bundles/ux/themes": "composition/stack/ux/themes",
  "bundles/ux/tweaks": "composition/stack/ux/tweaks",
  "bundles/ux/voice": "composition/stack/ux/voice",
  "profiles/headless": "composition/profile-headless",
  "profiles/tui": "composition/profile-tui",
  "profiles/web": "composition/profile-web",
};
const pluginNames = new Set(source.filter((file) => file.startsWith("plugins/")).map((file) => file.split("/")[1]));
for (const name of pluginNames) {
  prefix["plugins/" + name] = name === "dsh-tui"
    ? "composition/profile-tui/dsh-tui"
    : "composition/" + (groups[name] ? "stack/" + groups[name] + "/" : direct.has(name) || name.startsWith("provider-") ? "stack/" : "standalone/") + name;
}
const mappings = Object.entries(prefix).sort((a,b) => b[0].length - a[0].length);
function relocate(path) {
  for (const [from,to] of mappings)
    if (path === from || path.startsWith(from + "/")) return to + path.slice(from.length);
  return path;
}
const root = process.cwd();
function tracked(path) {
  const slash = path.split(sep).join("/");
  return oldFiles.has(slash) || oldDirs.has(slash);
}
function fixRelative(content, oldName, newName) {
  return content.replace(/(?:\.\.\/)+(?:[A-Za-z0-9_.\-*]+\/?)+/g, (match) => {
    const originalTarget = relative(root, resolve(root, dirname(oldName), match)).split(sep).join("/");
    if (!tracked(originalTarget)) return match;
    const nextTarget = relocate(originalTarget);
    const nextRelative = relative(dirname(newName), nextTarget).split(sep).join("/");
    return (nextRelative.startsWith(".") ? nextRelative : "./" + nextRelative) + (match.endsWith("/") ? "/" : "");
  });
}
function fixExplicitPaths(content) {
  for (const [from,to] of mappings) {
    content = content.replaceAll(from + "/", to + "/");
    // Match a directory at a Markdown link boundary without replacing package names.
    content = content.replaceAll("(" + from + ")", "(" + to + ")");
    content = content.replaceAll("`" + from + "`", "`" + to + "`");
  }
  return content;
}
const textFile = /(?:\.md|\.json|\.[cm]?[jt]sx?|\.ya?ml|\.css|\.html|\.sh|\.mjs)$/;
let repaired = 0;
for (const file of source) {
  if (!/^(plugins|bundles|profiles)\//.test(file) || !textFile.test(file)) continue;
  const dest = relocate(file);
  if (!existsSync(dest)) continue;
  const before = readFileSync(dest, "utf8");
  let after = fixRelative(before, file, dest);
  if (dest.endsWith("/README.md")) after = fixExplicitPaths(after);
  if (after !== before) { writeFileSync(dest, after); repaired++; }
}
const rootTargets = source.filter((file) =>
  /^(?:README\.md|\.agents\/(?:AGENTS\.md|notes\/.*\.md|rules\/.*\.md)|\.github\/workflows\/.*\.yml|scripts\/.*\.mjs|scripts\/.*\.ts)$/.test(file)
);
for (const file of rootTargets) {
  if (!existsSync(file)) continue;
  const before = readFileSync(file, "utf8");
  const after = fixExplicitPaths(before);
  if (after !== before) { writeFileSync(file, after); repaired++; }
}
const lock = "bun.lock";
if (existsSync(lock)) {
  const before = readFileSync(lock, "utf8");
  const after = fixExplicitPaths(before);
  if (after !== before) { writeFileSync(lock, after); repaired++; }
}
const readme = `# DSH Stack

Native DeepSeek Harness plugins, bundles and profile templates live in **one composition tree**. DSH remains responsible for runtime, package installation, updates, activation and user profiles; Stack only ships native packages and declarative composition.

## Physical composition

\`\`\`text
composition/
  profile-web/                  Native DSH Web profile template
  profile-headless/             Native headless profile template
  profile-tui/                  Native terminal profile template (includes Chimney source gitlink)
  stack/                        @dsh-stack/stack aggregate native bundle
    agents/                     @dsh-stack/bundle-agents
      agents/                   @dsh-stack/agents runtime plugin
    ai/                         @dsh-stack/bundle-ai
      providers/                @dsh-stack/bundle-providers and its mounted plugins
    integrations/               @dsh-stack/bundle-integrations
      formatters/               Child bundle and formatter implementation
      hosts/                    Child bundle and hosts implementation
      lsp/                      Child bundle and LSP implementation
    ux/                         @dsh-stack/bundle-ux
      themes/                   Child bundle and theme implementation
      tweaks/                   Child bundle
      voice/                    Child bundle and voice implementation
    <plugin>/                   Plugins inserted directly by the aggregate bundle
  headless/                     @dsh-stack/stack-headless (composes shared native bundles)
  standalone/                   Individually publishable plugins not mounted by aggregate patches
\`\`\`

This is a **source ownership tree**, not a second runtime loader. The native bundle dependency graph is a DAG: shared children can be referenced by both `stack` and `headless` without duplicate source folders. Package identities, `stack.compose` edges and native DSH patch ordering remain authoritative. A physical parent package can also contain independently buildable child package roots. A plugin under `standalone/` is intentionally not automatically activated by the full Stack patch.

## Install

Install DeepSeek Harness independently, then use its native package manager:

\`\`\`sh
dsh plugin --profile web add @dsh-stack/stack
dsh --profile web --dump-config
dsh --profile web
\`\`\`

For a terminal profile, use [the TUI profile](composition/profile-tui/README.md), whose Chimney DSH TUI source is pinned at `composition/profile-tui/dsh-tui`. For headless, install `@dsh-stack/stack-headless`. Templates are examples to copy explicitly into DSH home, never a parallel Stack installer.

## Development

\`\`\`sh
bun install
bun run build
bun run typecheck
bun run verify
bun run test
bun run release:assets
bun run release:verify
\`\`\`

Builds recursively discover *every* package root under `composition/`, flatten native bundles deterministically, and publish each package independently. The `_migrate/` gitlinks are non-installed external migration sources. See [native npm publication](.agents/notes/native-npm-publication.md) and [contributor rules](.agents/AGENTS.md).
`;
writeFileSync("README.md", readme);
function replaceIn(file, replacements) {
  const initial = readFileSync(file, "utf8");
  let changed = initial;
  for (const [a,b] of replacements) changed = changed.replaceAll(a,b);
  if (changed !== initial) writeFileSync(file, changed);
}
replaceIn(".agents/rules/repository-mission-and-canonical-structure.md", [
  ["The source of truth is a flat native plugin implementation catalog under", "The source of truth is a single recursive composition tree under"],
  ["arbitrarily nested reusable native DSH bundle packages under", "native DSH bundles within"],
  ["and real DSH profile templates under", "and native profile templates within"],
  ["Only leaf bundles with package manifests are workspaces.", "Bundle and plugin package roots may nest; every package manifest defines an independent workspace."],
  ["There is no", "There is no"],
]);
replaceIn(".agents/notes/ARCHITECTURE.md", [
  ["is the flat source implementation catalog", "is the recursive source implementation graph"],
  ["Their logical layout is not an additional runtime hierarchy.", "Physical nesting records composition ownership; native DSH metadata remains the runtime authority."],
  ["Every leaf bundle", "Every native bundle"],
]);
replaceIn(".agents/AGENTS.md", [
  ["single flat implementation package list; no plugin grouping levels.", "recursive source package tree organized by composition ownership."],
  ["recursively nested leaf DSH bundles", "independently publishable nested DSH bundles"],
]);
console.log("Repaired " + repaired + " moved/root source files; final composition package count " +
  execFileSync("git", ["ls-files", "composition"], {encoding:"utf8"}).trim().split("\n").length);
