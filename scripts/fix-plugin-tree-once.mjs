/** One-shot repair of relative references after moving the composition tree to plugins/ and profiles/. */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";

const prior = "84295ba7b69794ae11bc708deace285cbac67ece";
const oldPaths = execFileSync("git", ["ls-tree", "-r", "--name-only", prior], {encoding:"utf8"}).trim().split("\n");
const oldFiles = new Set(oldPaths);
const oldDirs = new Set();
for (const name of oldPaths) {
  let dir = dirname(name);
  while (dir !== "." && !oldDirs.has(dir)) {
    oldDirs.add(dir);
    dir = dirname(dir);
  }
}
const group = {
  "agent-preset-coding":"agents", "agent-preset-default":"agents", "agent-preset-manager":"agents",
  automations:"agents", commands:"agents", personas:"agents", skills:"agents",
  "dialect-gemini":"ai/providers",
  "lucide-animated":"ux/themes", "skin-claude":"ux/themes", "skin-codex":"ux/themes", "skin-deepseek":"ux/themes",
  "profile-runtime":"ux", "settings-panel":"ux",
  "trading-backtest":"integrations", "trading-market-data":"integrations",
  "trading-optimizer":"integrations", "trading-research":"integrations", "workspace-files":"integrations",
  "plugin-kit":"",
};
const mappings = [
  ["composition/profile-tui/dsh-tui","plugins/headless/dsh-tui"],
  ...Object.entries(group).map(([key,value]) => ["composition/standalone/"+key,"plugins/stack/"+(value ? value+"/" : "")+key]),
  ["composition/profile-headless","profiles/headless"],
  ["composition/profile-tui","profiles/tui"],
  ["composition/profile-web","profiles/web"],
  ["composition/headless","plugins/headless"],
  ["composition/stack","plugins/stack"],
].sort((a,b)=>b[0].length-a[0].length);
function destination(path) {
  for (const [from,to] of mappings) {
    if (path===from || path.startsWith(from+"/")) return to+path.slice(from.length);
  }
  return path;
}
const root=process.cwd();
const slash=path=>path.split(sep).join("/");
/** Retarget an old source file's root-relative import to its new source/package location. */
function retarget(content,oldFile,newFile) {
  return content.replace(/(?:\.\.\/)+(?:[A-Za-z0-9_.\-*]+\/?)+/g, match=>{
    const from=slash(relative(root,resolve(root,dirname(oldFile),match)));
    if (!oldFiles.has(from) && !oldDirs.has(from)) return match;
    const to=destination(from);
    const rel=slash(relative(dirname(newFile),to));
    return (rel.startsWith(".")?rel:"./"+rel)+(match.endsWith("/")?"/":"");
  });
}
/** Update explicit repository file references with no path derivation. */
function explicit(content) {
  for (const [from,to] of mappings) {
    content=content.replaceAll(from+"/",to+"/");
    content=content.replaceAll("("+from+")","("+to+")");
    content=content.replaceAll("`"+from+"`","`"+to+"`");
  }
  content=content.replaceAll("composition/standalone/", "plugins/stack/");
  return content;
}
const textFile=/\.(?:md|json|[cm]?[jt]sx?|ya?ml|css|html|sh|mjs)$/i;
let count=0;
for (const from of oldPaths) {
  if (!from.startsWith("composition/") || !textFile.test(from)) continue;
  const path=destination(from);
  if (!existsSync(path)) continue;
  const before=readFileSync(path,"utf8");
  const after=explicit(retarget(before,from,path));
  if (after!==before) {writeFileSync(path,after);count++;}
}
const rootPaths=oldPaths.filter(p=>/^(?:README\.md|\.agents\/.*\.md|scripts\/.*\.(?:mjs|ts)|\.github\/workflows\/.*\.yml|bun\.lock|knip\.json|package\.json|\.jscpd\.json)$/.test(p));
for(const path of rootPaths) {
  if (!existsSync(path)) continue;
  const before=readFileSync(path,"utf8");
  const after=explicit(before);
  if(after!==before){writeFileSync(path,after);count++;}
}
const overview = [
  "# DSH Stack", "",
  "Native DeepSeek Harness plugins, nested bundles, and real profile templates. DSH retains ownership of package installation, profile activation, updates, runtime and CLI; Stack distributes native packages and declarative patches.",
  "", "## Native composition tree", "",
  "```text", "profiles/", "  web/                         Native Web profile template",
  "  headless/                    Native headless profile template",
  "  tui/                         Native TUI profile template",
  "plugins/", "  stack/                       @dsh-stack/stack full bundle",
  "    agents/                    Agents bundle, agent plugin and related extensions",
  "    ai/                        AI bundle", "      providers/               Providers bundle with implementation plugins",
  "    integrations/              Integrations bundle", "      formatters/              Formatters bundle and implementation",
  "      hosts/                   Hosts bundle and implementation", "      lsp/                     LSP bundle and implementation",
  "    ux/                        UX bundle", "      themes/                  Themes bundle and related plugins",
  "      tweaks/                  Tweaks bundle", "      voice/                   Voice bundle and plugin",
  "    <name>/                    Plugins mounted directly by full Stack",
  "  headless/                    @dsh-stack/stack-headless bundle",
  "    dsh-tui/                   Chimney third-party source submodule (external release)",
  "```", "",
  "Every nested `package.json` is still an independently publishable npm package. The physical folders follow bundle ownership, while the native `stack.compose` dependency DAG and Cordis patch rows determine runtime activation. Placing an optional plugin in a bundle's source folder does not activate it automatically. Shared bundles (for example between full Stack and headless) are not duplicated.",
  "", "## Native installation", "",
  "```sh", "dsh plugin --profile web add @dsh-stack/stack",
  "dsh --profile web --dump-config", "dsh --profile web", "```", "",
  "For TUI use [the TUI profile](profiles/tui/README.md) and Chimney's compatible `@deepseek-harness-tui/dsh-tui`. Headless installation uses `@dsh-stack/stack-headless`. DSH user profiles are maintained by DSH, not by Stack.",
  "", "## Development", "",
  "```sh", "bun install", "bun run build", "bun run typecheck", "bun run verify", "bun run test",
  "bun run release:assets", "bun run release:verify", "```", "",
  "The build walks all nested plugin and bundle package manifests. `_migrate/` is not part of an installed Stack. See [native npm publication](.agents/notes/native-npm-publication.md) and [contributor rules](.agents/AGENTS.md).", ""
].join("\n");
writeFileSync("README.md",overview);
const rule = ".agents/rules/repository-mission-and-canonical-structure.md";
writeFileSync(rule, `---
date: 2026-10-13
status: active
---

# Repository mission and canonical structure

Stack publishes independent native DSH plugin implementations and composable bundles inside a single recursive \`plugins/\` source tree. Each native DSH bundle is a directory with its own package manifest and composition patch; nested child bundles and plugin packages may coexist below that directory. The root \`profiles/<profile>/\` directory contains separately managed native DSH profile templates, not workspace packages. No standalone plugin folder or duplicate implementations.

Placement follows ownership in the native bundle graph. \`stack.compose\` declares dependency edges, and bundle source patches declare Cordis rows. Compile-time generation deterministically flattens native bundle patches; source nesting itself does not activate plugins, and independently owned optional plugins need explicit native activation. Shared DAG nodes have one source, not duplicate source trees.

DSH alone manages runtime lifecycle, installation, activation, profiles and updates. Stack may not recreate a launcher, profile manager or second runtime loader. The independently maintained Chimney TUI gitlink is \`plugins/headless/dsh-tui\`; DSH's \`tui\` profile activates its published package directly. \`_migrate/\` holds non-installed external migration sources.

Each package root remains an independent npm workspace, versioned and released with the native DSH contract. Every project command, build verifier and release/discovery process recursively locates package roots by \`package.json\` and native DSH metadata rather than assuming a fixed folder depth.
`);
const profileRule = ".agents/rules/profiles.md";
let profileText=readFileSync(profileRule,"utf8").replaceAll("profiles/<name>/","profiles/<name>/").replaceAll("Arbitrarily nested reusable bundles are under `bundles/`, not under `profiles/`.","Arbitrarily nested native bundles are under `plugins/`; profile templates remain at root `profiles/`.").replaceAll("The Stack repository stores shareable templates at `composition/","The Stack repository stores shareable templates at `profiles/");
writeFileSync(profileRule,profileText);
const arch=".agents/notes/ARCHITECTURE.md";
let architecture=readFileSync(arch,"utf8").replaceAll("the recursive source implementation graph","the recursive source implementation and bundle graph").replaceAll("`bundles/` contains arbitrarily nested native DSH composition-only packages; `profiles/` contains actual DSH profile directory templates.","Nested native bundles and their implementation plugins share `plugins/`; `profiles/` remains the separate DSH profile-template root.").replaceAll("Physical nesting records composition ownership; native DSH metadata remains the runtime authority.","Physical nesting records composition ownership; native DSH metadata remains the runtime authority.");
writeFileSync(arch,architecture);
console.log("Retargeted "+count+" text files; plugins tree now owns all native packages.");
