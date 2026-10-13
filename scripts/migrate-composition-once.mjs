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
const readme = "# DSH Stack\n\nNative DeepSeek Harness plugins, bundles and profile templates live in **one composition tree**. DSH owns installation, runtime, updates and activation; Stack ships native packages and declarative composition.\n\n## Composition tree\n\n```text\ncomposition/\n  profile-web/           Native Web profile template\n  profile-headless/      Native headless profile template\n  profile-tui/           Native terminal profile and pinned Chimney TUI source\n  stack/                 @dsh-stack/stack aggregate bundle\n    agents/              Agents bundle and mounted agent plugin\n    ai/providers/        AI and providers bundles and mounted plugins\n    integrations/        Integrations bundle (formatters, hosts, LSP)\n    ux/                  UX bundle (themes, tweaks, voice)\n    <plugin>/            Plugins directly mounted by the aggregate bundle\n  headless/              @dsh-stack/stack-headless native bundle\n  standalone/            Optional publishable plugins not auto-mounted by Stack\n```\n\nThe native bundle graph is a DAG, not a tree: packages referenced by both full Stack and headless are stored only once. Their names, `stack.compose` edges, and native patches control actual installation. Nesting never introduces a second loader.\n\n## Install\n\n```sh\ndsh plugin --profile web add @dsh-stack/stack\ndsh --profile web --dump-config\ndsh --profile web\n```\n\nHeadless installation uses `@dsh-stack/stack-headless`. Terminal usage is documented in [the TUI profile](composition/profile-tui/README.md). Profile templates are DSH-owned on installation and are never mutated by an independent Stack manager.\n\n## Development\n\n```sh\nbun install\nbun run build\nbun run typecheck\nbun run verify\nbun run test\nbun run release:assets\nbun run release:verify\n```\n\nPackages are discovered recursively in `composition/`, and each native bundle is flattened before packaging. Migration-only gitlinks under `_migrate/` are not installed. See [native npm publication](.agents/notes/native-npm-publication.md) and [contributor rules](.agents/AGENTS.md).\n";
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
