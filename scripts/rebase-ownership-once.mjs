/**
 * One-time repository-wide path rebase after direct Stack plugins were moved
 * under their actual nested native bundle ownership folders.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { relative, resolve, dirname, sep } from "node:path";

const previous = "ab9daf0a7aad7b5c1ee1fb944bc1c80cd3fe5a0f";
const original = execFileSync("git", ["ls-tree", "-r", "--name-only", previous], { encoding: "utf8" })
  .trim().split("\n");
const oldFiles = new Set(original);
const oldDirs = new Set();
for (const file of original) {
  let d = dirname(file);
  while (d !== "." && !oldDirs.has(d)) {
    oldDirs.add(d);
    d = dirname(d);
  }
}
const maps = [];
const rootOf = "plugins/stack/";
for (const folder of oldDirs) {
  if (!folder.startsWith(rootOf) || folder.split("/").length !== 3) continue;
  const name = folder.slice(rootOf.length);
  let owner = null;
  if (name.startsWith("provider-") || name.startsWith("dialect-")) owner = "ai/providers";
  else if (name.startsWith("tweak-")) owner = "ux/tweaks";
  else if (["agent-actions", "loops", "tools"].includes(name)) owner = "agents";
  else if (["icon-engine", "skin-host", "skin-runtime", "skin-settings"].includes(name)) owner = "ux/themes";
  else if (["sidebar-preferences", "sidebar-settings", "sidebar-shell", "profile-ui", "marketplace", "marketplace-source-dsh-stack", "translator"].includes(name)) owner = "ux";
  else if (["repos", "directory-picker-fix"].includes(name)) owner = "integrations";
  if (owner) maps.push([folder, rootOf + owner + "/" + name]);
}
maps.sort((a, b) => b[0].length - a[0].length);
function relocate(path) {
  for (const [from, to] of maps) {
    if (path === from || path.startsWith(from + "/")) return to + path.slice(from.length);
  }
  return path;
}
const slash = path => path.split(sep).join("/");
const origin = process.cwd();
/** Only rewrite relative references that pointed to a tracked source or package root before moving. */
function fixRelative(content, oldPath, newPath) {
  return content.replace(/(?:\.\.\/)+(?:[A-Za-z0-9_.\-*]+\/?)+/g, match => {
    const oldTarget = slash(relative(origin, resolve(origin, dirname(oldPath), match)));
    const known = oldFiles.has(oldTarget) || oldDirs.has(oldTarget) ||
      maps.some(([from]) => oldTarget === from || oldTarget.startsWith(from + "/"));
    if (!known) return match;
    const newTarget = relocate(oldTarget);
    const newRel = slash(relative(dirname(newPath), newTarget));
    return (newRel.startsWith(".") ? newRel : "./" + newRel) + (match.endsWith("/") ? "/" : "");
  });
}
/** Update explicit paths in written documentation and tracked configuration. */
function explicit(content) {
  for (const [from, to] of maps) {
    content = content.replaceAll(from + "/", to + "/");
    content = content.replaceAll("(" + from + ")", "(" + to + ")");
    content = content.replaceAll("`" + from + "`", "`" + to + "`");
  }
  return content;
}
const sourceExt = /\.(?:[cm]?[jt]sx?|md|json|ya?ml|css|html|sh)$/i;
let changed = 0;
for (const file of original) {
  if (!file.startsWith("plugins/") || !sourceExt.test(file)) continue;
  const dest = relocate(file);
  if (!existsSync(dest)) continue;
  const before = readFileSync(dest, "utf8");
  const after = explicit(fixRelative(before, file, dest));
  if (after !== before) { writeFileSync(dest, after); changed++; }
}
const rootConfig = original.filter(p => p.startsWith("scripts/") ||
  p.startsWith(".agents/") || p.startsWith(".github/workflows/") ||
  ["README.md", "knip.config.js", "package.json", "bun.lock", ".jscpd.json"].includes(p));
for (const file of rootConfig) {
  if (!sourceExt.test(file) || !existsSync(file)) continue;
  const before = readFileSync(file, "utf8");
  const after = explicit(before);
  if (after !== before) { writeFileSync(file, after); changed++; }
}
console.log("Relocated", maps.length, "plugin packages, rebased", changed, "files.");
