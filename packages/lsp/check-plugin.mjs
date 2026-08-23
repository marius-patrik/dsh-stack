import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";

const root = mkdtempSync(join(tmpdir(), "dsh-lsp-"));
const lspCli = new URL("./bin/lsp.mjs", import.meta.url).pathname;

const plugin = await import("./lib/index.js");
const { NS, LspSettings, LspConfig } = await import("./lib/settings.js");

if (plugin.name !== "dsh-lsp") throw new Error("bad name");
if (typeof plugin.apply !== "function") throw new Error("bad apply");
if (!Array.isArray(plugin.inject)) throw new Error("bad inject");
if (plugin.default !== undefined)
  throw new Error("function plugins must not have a default export");
assert.equal(NS, "dsh-lsp");
assert.equal(typeof LspSettings, "function");
assert.equal(typeof LspConfig, "function");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// mergeServers: settings table wins over the entry table, empty-safe.
assert.deepEqual(plugin.mergeServers({}, undefined), {});
assert.deepEqual(
  plugin.mergeServers(
    { a: { command: "x", extensionToLanguage: { ".x": "x" } } },
    { servers: { b: { command: "y", extensionToLanguage: { ".y": "y" } } } },
  ),
  {
    a: { command: "x", extensionToLanguage: { ".x": "x" } },
    b: { command: "y", extensionToLanguage: { ".y": "y" } },
  },
);
assert.deepEqual(
  plugin.mergeServers(
    { a: { command: "x", extensionToLanguage: { ".x": "x" } } },
    { servers: { a: { command: "z", extensionToLanguage: { ".a": "a" } } } },
  ).a.command,
  "z",
);
console.log("mergeServers ok (settings win)");

// apply over a stub settings service with an EMPTY table: the LSP service def
// mounts (so ctx.lsp exists) but no stdio provider/tool (server table empty).
const ctx = new Context();
const sections = new Map([[NS, { servers: {} }]]);
ctx.provide("settings", {
  get: (ns) => sections.get(ns),
  register(_ns, _schema, opts) {
    sections.set(_ns, opts.base);
    return { get: (ns) => sections.get(ns), watch: () => undefined };
  },
});
const warns = [];
ctx.logger = { info: () => {}, warn: (m) => warns.push(m) };
plugin.apply(ctx, {});
await new Promise((resolve) => setTimeout(resolve, 200));
assert.ok(ctx.get("lsp") !== undefined, "Lsp service definition should mount");
assert.ok(warns.some((m) => m.includes("no LSP servers configured")));
console.log("empty-table boot ok (service def mounted, no providers, guidance logged)");

// apply with a server in the settings section: the stdio provider and tool
// mount with the settings server (spy wraps real ctx.plugin and records).
const ctx2 = new Context();
const sections2 = new Map([
  [
    NS,
    {
      servers: {
        typescript: {
          command: "typescript-language-server",
          extensionToLanguage: { ".ts": "typescript" },
          args: ["--stdio"],
        },
      },
    },
  ],
]);
ctx2.provide("settings", {
  get: (ns) => sections2.get(ns),
  register(_ns, _schema, opts) {
    if (!sections2.has(_ns)) sections2.set(_ns, opts.base);
    return { get: (ns) => sections2.get(ns), watch: () => undefined };
  },
});
const mounts = [];
const realPlugin = ctx2.plugin.bind(ctx2);
ctx2.plugin = function (mod, cfg) {
  const name = typeof mod === "object" ? mod.name : undefined;
  if (name === "lsp-stdio" || name === "tool-lsp") {
    mounts.push(name);
    return Promise.resolve();
  }
  return realPlugin.call(this, mod, cfg);
};
ctx2.logger = { info: () => {}, warn: () => {} };
plugin.apply(ctx2, {});
await new Promise((resolve) => setTimeout(resolve, 300));
assert.ok(mounts.includes("lsp-stdio"), "expected lsp-stdio mount");
assert.ok(mounts.includes("tool-lsp"), "expected tool-lsp mount");
console.log("mounted-provider path ok:", mounts.join(", "));
// CLI: `dsh lsp servers add/remove/list` round-trip against a temp home.
const home = join(root, "home");
const settingsPath = join(home, "settings.yaml");
execFileSync(
  process.execPath,
  [
    lspCli,
    "servers",
    "add",
    "typescript",
    "typescript-language-server",
    "--ext=.ts=typescript",
    "--ext=.tsx=typescriptreact",
  ],
  { env: { ...process.env, DSH_HOME: home } },
);
const text = readFileSync(settingsPath, "utf8");
assert.ok(text.includes("dsh-lsp:"));
assert.ok(text.includes('"typescript"'));
assert.ok(text.includes(".ts"));
execFileSync(process.execPath, [lspCli, "list"], { env: { ...process.env, DSH_HOME: home } });
execFileSync(process.execPath, [lspCli, "servers", "remove", "typescript"], {
  env: { ...process.env, DSH_HOME: home },
});
const text2 = readFileSync(settingsPath, "utf8");
assert.ok(!text2.includes('"typescript"'));
console.log("cli settings round-trip ok");

rmSync(root, { recursive: true, force: true });
console.log("plugin check passed");
