import { mkdtempSync, readFileSync, rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";

const root = mkdtempSync(join(tmpdir(), "dsh-tweaks-"));
process.env.HOME = root;
process.env.DSH_HOME = join(root, ".agents");

const plugin = await import("./lib/index.js");
const share = await import("./lib/share.js");
const stats = await import("./lib/stats.js");
const sessionMod = await import("./lib/session.js");
const { readTweaksSection, writeTweaksSection, normalizeSection, sectionsEqual } = await import(
  "./lib/mirror.js"
);

if (plugin.name !== "dsh-tweaks") throw new Error("bad name");
if (typeof plugin.apply !== "function") throw new Error("bad apply");
if (!Array.isArray(plugin.inject)) throw new Error("bad inject");
if (plugin.default !== undefined)
  throw new Error("function plugins must not have a default export");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

const home = join(root, ".agents");
const base = {
  homeRoot: "/new/home",
  command: "web",
  share: { enabled: true, allowInteractive: false, advertisedHost: "", basePath: "/share" },
  stats: { enabled: true, format: "table" },
  session: {
    planToggle: true,
    forkUndo: true,
    dragDropImages: true,
    maxImageBytes: 8 * 1024 * 1024,
  },
  commands: { enabled: true, commands: [{ name: "ping", description: "echo", reply: "pong" }] },
  keybinds: { enabled: true, keymap: [{ action: "undo", keys: "mod+z", when: "" }] },
};

// Boot the plugin over stub settings + webServer/commands services.
const ctx = new Context();
const registered = [];
const settings = {
    /** register implementation. */
register(_ns, _schema, opts) {
    return { get: () => opts.base, watch: () => undefined };
  },
};
ctx.provide("settings", settings);
ctx.provide("commands", {
    /** register implementation. */
register(def) {
    registered.push({ name: def.name, description: def.description });
    return () => undefined;
  },
});
ctx.provide("webServer", {
    /** register implementation. */
register(route) {
    assert.equal(route.kind, "prefix");
    assert.equal(route.path, "/share");
    return () => undefined;
  },
});
ctx.provide("planMode", {
    /** set implementation. */
set(_agent, active) {
    assert.equal(active, false);
    return "committed";
  },
});
ctx.provide("sessions", {
    /** create implementation. */
create() {
    return {};
  },
});
plugin.apply(ctx, base);

await new Promise((resolve) => setTimeout(resolve, 200));
const settingsPath = join(home, "settings.yaml");
assert.ok(existsSync(settingsPath), "settings.yaml was not mirrored");
const text = readFileSync(settingsPath, "utf8");
assert.ok(text.includes("homeRoot: /new/home"), `homeRoot missing:\n${text}`);
assert.ok(text.includes("command: web"), `command missing:\n${text}`);
const section = await readTweaksSection(settingsPath);
assert.deepEqual(section, { homeRoot: "/new/home", command: "web" });
console.log("boot mirror ok:\n" + text.trim());

// Idempotent second mirror.
plugin.apply(ctx, base);
await new Promise((resolve) => setTimeout(resolve, 200));
const second = await readTweaksSection(settingsPath);
assert.deepEqual(second, { homeRoot: "/new/home", command: "web" });
console.log("idempotent mirror ok");

// Mirror helpers preserve unrelated sections.
const doc = join(root, "other", "settings.yaml");
await writeTweaksSection(doc, normalizeSection({ homeRoot: "/new/home" }));
await writeTweaksSection(doc, normalizeSection({ homeRoot: "/newer/home" }));
const merged = readFileSync(doc, "utf8");
assert.ok(merged.includes("homeRoot: /newer/home"));
const mergedSection = await readTweaksSection(doc);
assert.deepEqual(mergedSection, { homeRoot: "/newer/home" });
assert.equal(await readTweaksSection(join(root, "missing", "settings.yaml")), undefined);
console.log("merge + missing-file helpers ok");

// normalize / equality helpers.
assert.deepEqual(normalizeSection({}), {});
assert.deepEqual(normalizeSection({ homeRoot: "  " }), {});
assert.ok(sectionsEqual(undefined, undefined));
assert.ok(!sectionsEqual({ homeRoot: "/a" }, { homeRoot: "/b" }));

// v2: commands bridge registered the config-file command through the stub.
await new Promise((resolve) => setTimeout(resolve, 50));
const names = registered.map((entry) => entry.name);
assert.ok(names.includes("ping"), `config command not registered: ${JSON.stringify(registered)}`);
assert.ok(names.includes("build"), `plan toggle not registered: ${JSON.stringify(registered)}`);
assert.ok(names.includes("undo"), `undo not registered: ${JSON.stringify(registered)}`);
assert.ok(names.includes("redo"), `redo not registered: ${JSON.stringify(registered)}`);
console.log("command registrations ok:", names.join(", "));

// v2: share renderer.
const eventLog = [
  JSON.stringify({
    type: "user/message",
    seq: 0,
    time: 1,
    data: { message: { content: "hello <world>" } },
  }),
  JSON.stringify({
    type: "assistant/message",
    seq: 1,
    time: 2,
    data: { message: { content: "hi there" } },
  }),
  JSON.stringify({ type: "tool/call", seq: 2, time: 3, data: { name: "bash" } }),
  JSON.stringify({ type: "tool/result", seq: 3, time: 4, data: { ok: true } }),
  "",
].join("\n");
const lines = share.parseLog(eventLog);
assert.equal(lines.length, 4);
assert.equal(lines[0].role, "user");
assert.equal(lines[0].text, "hello <world>");
assert.equal(lines[2].role, "tool");
const page = share.renderSharePage("session-1", lines, false);
assert.ok(page.includes("hello &lt;world&gt;"));
assert.ok(page.includes("session-1</h1>"));
assert.ok(!page.includes("#live"));
console.log("share renderer ok");

// v2: token equality + write/read round trip.
assert.ok(share.tokensEqual("a", "a"));
assert.ok(!share.tokensEqual("a", "b"));
const token = share.generateToken();
const tokenPath = await share.writeShareToken(home, token);
assert.equal(await share.readShareToken(home), token);
assert.ok(tokenPath.includes("share.token"));
assert.equal(await share.readShareToken(join(root, "nope")), undefined);
console.log("share token helpers ok");

// v2: share log path resolution finds a jsonl log we plant.
const wsDir = join(home, "sessions", "--Users-user--");
mkdirSync(join(wsDir, "session-abc"), { recursive: true });
writeFileSync(join(wsDir, "session-abc", "session.jsonl"), eventLog);
const found = await share.resolveSessionLogPath(home, "abc", "/Users/user");
assert.equal(found, join(wsDir, "session-abc", "session.jsonl"));
const foundPrefixed = await share.resolveSessionLogPath(home, "session-abc", "/Users/user");
assert.equal(foundPrefixed, join(wsDir, "session-abc", "session.jsonl"));
assert.equal(await share.resolveSessionLogPath(home, "missing", "/Users/user"), undefined);
const ids = await share.listSessionIds(home, "/Users/user");
assert.deepEqual(ids, ["abc"]);

// v2: interactive gate — handler renders read-only without token, and even
// with a token when allowInteractive is false.
rmSync(join(home, "share.token"), { force: true });
const handler = share.makeShareHandler(home, "/share", true);
const /** respond implementation. */
respond = async (url) => {
  const res = {
    _status: 0,
    _body: "",
        /** writeHead implementation. */
writeHead(s) {
      this._status = s;
    },
        /** end implementation. */
end(b) {
      this._body = b;
    },
  };
  await handler({ url }, res);
  return res;
};
const plain = await respond(`/share/abc`);
assert.equal(plain._status, 200);
assert.ok(!plain._body.includes("#live"));
const denied = await respond(`/share/abc?token=${token}`);
assert.ok(!denied._body.includes("#live"));
await share.writeShareToken(home, token);
const granted = await respond(`/share/abc?token=${token}`);
assert.ok(granted._body.includes("#live"));
const roHandler = share.makeShareHandler(home, "/share", false);
const roRes = {
  _status: 0,
  _body: "",
    /** writeHead implementation. */
writeHead(s) {
    this._status = s;
  },
    /** end implementation. */
end(b) {
    this._body = b;
  },
};
await roHandler({ url: `/share/abc?token=${token}` }, roRes);
assert.ok(!roRes._body.includes("#live"));
console.log("share log path helpers + interactive gate ok");

// v2: stats from a planted projection cache.
const cache = {
  unit: { name: "session_projcache", version: 3 },
  global: null,
  tables: {
    sessions: {
      "session-abc": {
        identity: { createdAt: 1000, cwd: "/Users/user" },
        rows: {
          sessionStats: {
            ver: 1,
            seq: 5,
            val: {
              turns: 3,
              steps: 9,
              llmMs: 1200,
              toolMs: 800,
              ttftMs: 100,
              decodeMs: 900,
              decodeTokens: 500,
            },
          },
        },
      },
    },
  },
};
mkdirSync(join(home, "storages"), { recursive: true });
writeFileSync(join(home, "storages", "session_projcache.json"), JSON.stringify(cache));
const parsed = await stats.readProjectionCache(home);
const row = stats.sessionStatsFromCache(parsed, "session-abc");
assert.equal(row.turns, 3);
assert.equal(row.cached, true);
assert.equal(row.llmMs, 1200);
const emptyRow = stats.sessionStatsFromCache(parsed, "session-zzz");
assert.equal(emptyRow.cached, false);
const table = stats.formatTable([row, emptyRow]);
assert.ok(table.includes("session-abc".slice(0, 8)));
assert.ok(table.includes("session-zzz".slice(0, 8)));
const csv = stats.formatCsv([row]);
assert.ok(csv.startsWith("sessionId,cwd,createdAt"));
assert.ok(csv.includes("session-abc,/Users/user,1000,3,9,1200,800,100,900,500"));
const json = stats.formatJson([row]);
assert.ok(json.includes('"sessionId":"session-abc"'));
console.log("stats projection helpers ok");

// v2: session-UX validators.
sessionMod.validateCommand({ name: "ping", description: "x", reply: "pong" });
assert.throws(() => sessionMod.validateCommand({ name: "Ping", description: "x", reply: "pong" }));
assert.throws(() => sessionMod.validateCommand({ name: "/ping", description: "x", reply: "pong" }));
assert.throws(() => sessionMod.validateCommand({ name: "ping", description: "x", reply: "  " }));
sessionMod.validateKeybinds([{ action: "undo", keys: "mod+z" }]);
assert.throws(() => sessionMod.validateKeybinds([{ action: "undo", keys: " " }]));
assert.throws(() =>
  sessionMod.validateKeybinds([
    { action: "undo", keys: "mod+z" },
    { action: "undo", keys: "alt+z" },
  ]),
);
console.log("session-UX validators ok");

// v2: fork helper.
const forkSeed = [
  { type: "user/message", seq: 0, time: 1, data: { message: { content: "a" } } },
  { type: "assistant/message", seq: 1, time: 2, data: { message: { content: "b" } } },
  { type: "user/message", seq: 2, time: 3, data: { message: { content: "c" } } },
];
const agent = { session: { events: forkSeed } };
const forks = [];
const sessionsStub = {
    /** create implementation. */
create(_id, opts) {
    forks.push(opts);
    return {};
  },
};
const undoResult = sessionMod.forkSession(sessionsStub, agent, -1);
assert.equal(undoResult.kind, "success");
assert.equal(forks[0].seed.length, 2);
const redoResult = sessionMod.forkSession(sessionsStub, agent, 1);
assert.equal(forks[1].seed.length, 3);
const emptyResult = sessionMod.forkSession(sessionsStub, { session: { events: [] } }, -1);
assert.equal(emptyResult.kind, "error");
console.log("fork helper ok");

// Phase A: the browser half (lib/client.js) is the take-over bundle for the
// `sidebar` + `sidebar.settings` shells. It is hand-authored and copies the
// platform seed words the raw bundle require()s, so the check captures the
// factory, drives it with stub modules, and asserts the registrations the
// harness browser loads at runtime.
const clientPath = join(import.meta.dirname, "lib", "client.js");
assert.ok(existsSync(clientPath), "lib/client.js missing — run `npm run build`");
const rootClient = readFileSync(join(import.meta.dirname, "client.js"), "utf8");
const builtClient = readFileSync(clientPath, "utf8");
assert.equal(builtClient, rootClient, "lib/client.js must be the built copy of client.js");

globalThis.window = {
  __ModuleLoader__: {
    load: (spec) => {
      globalThis.__clientSpec = spec;
    },
  },
};
await import("./lib/client.js");
const clientSpec = globalThis.__clientSpec;
assert.equal(clientSpec.id, "dsh-tweaks");
assert.equal(typeof clientSpec.factory, "function");

const stubModules = {
  react: {},
  "@deepseek-ai/dsh-client-ui-primitives": {},
  "@deepseek-ai/dsh-client-ui-slots": {
    resolveSlotLabel: (label) => (typeof label === "function" ? label() : label),
  },
  "@deepseek-ai/dsh-client-web-react": {
    bindSnapshotSelector: (observable) => (selector) => selector(observable.getSnapshot()),
  },
};
const /** stubRequire implementation. */
stubRequire = (name) => stubModules[name];
const clientModule = clientSpec.factory(stubRequire);
assert.equal(typeof clientModule.apply, "function", "client bundle apply must be a function");
assert.deepEqual(clientModule.inject, [
  "slots",
  "locale",
  "layout",
  "sessions",
  "workspaces",
  "connection",
]);

// Stub ctx that records registrations and resolves inject callbacks inline.
const records = new Map();
const localeEntries = new Map();
let localeRevision = 0;
const allRecords = [];
const slotsStub = {
    /** register implementation. */
register(entry, component) {
    records.set(entry.name, { entry, component });
    allRecords.push({ entry, component });
    return () => {
      records.delete(entry.name);
    };
  },
    /** inject implementation. */
inject(name, fn) {
    const dispose = fn();
    return () => {
      if (dispose) dispose();
    };
  },
    /** entries implementation. */
entries(name) {
    const list = [];
    for (const rec of allRecords) if (rec.entry.name === name) list.push(rec);
    return list.map((rec) => ({ options: rec.entry }));
  },
    /** getVersion implementation. */
getVersion() {
    return 1;
  },
    /** subscribe implementation. */
subscribe() {
    return () => {};
  },
};
const connectionStub = {
  isLoopback: true,
  api: {
    settings: {
      describe: async () => ({ result: { ok: true, value: { hasDocument: true } } }),
      openDocument: async () => ({ result: { ok: true } }),
    },
  },
};
const ctxStub = {
    /** effect implementation. */
effect(fn) {
    fn();
    return () => {};
  },
    /** on implementation. */
on() {
    return () => {};
  },
    /** get implementation. */
get(name) {
    if (name === "connection") return connectionStub;
    throw new Error("unexpected get: " + name);
  },
  locale: {
        /** register implementation. */
register(ns, dicts) {
      localeEntries.set(ns, dicts);
    },
        /** bind implementation. */
bind(ns) {
      const dicts = localeEntries.get(ns);
      return (key) => (dicts && dicts.zh[key] !== undefined ? dicts.zh[key] : key);
    },
        /** getSnapshot implementation. */
getSnapshot() {
      return { revision: localeRevision };
    },
        /** subscribe implementation. */
subscribe() {
      return () => {};
    },
  },
  layout: {   /** toggleSidebar implementation. */
/** toggleSidebar implementation. */
toggleSidebar() {} },
  workspaces: {   /** startSession implementation. */
/** startSession implementation. */
startSession() {} },
  slots: slotsStub,
};
clientModule.apply(ctxStub);

const /** assertRegistered implementation. */
assertRegistered = (name, reason) =>
  assert.ok(records.has(name), `${reason}: ${name} not registered`);
assertRegistered("sidebar", "Phase A");
assertRegistered("sidebar.newSession", "Phase A");
assertRegistered("sidebar.settings", "Phase A");
assertRegistered("settings.trigger", "Phase A");
assertRegistered("settings.header", "Phase A");
assertRegistered("settings.close", "Phase A");
assertRegistered("settings.action", "Phase A");
assertRegistered("settings.section", "Phase A");
assert.ok(localeEntries.has("sidebar"), "sidebar dictionaries not registered");
assert.ok(localeEntries.has("settings"), "settings dictionaries not registered");

const sidebarEntry = records.get("sidebar").entry;
for (const hole of [
  "sidebar.workspaces",
  "sidebar.settings",
  "sidebar.footer.action",
  "sidebar.newSession",
  "sidebar.history",
]) {
  assert.ok(sidebarEntry.children[hole], `sidebar must declare ${hole}`);
}
assert.equal(sidebarEntry.locale, "sidebar");

const shellEntry = records.get("sidebar.settings").entry;
for (const hole of [
  "settings.trigger",
  "settings.header",
  "settings.action",
  "settings.close",
  "settings.section",
  "settings.onboarding",
  "settings.section.icon",
]) {
  assert.ok(shellEntry.children[hole], `settings shell must declare ${hole}`);
}

const generalRec = allRecords.find(
  (r) => r.entry.name === "settings.section" && r.entry.id === "general",
);
assert.ok(generalRec, "general settings section must be registered");
const sectionOptions = generalRec.entry;
assert.equal(sectionOptions.id, "general");
assert.equal(sectionOptions.order, 0);
assert.equal(typeof sectionOptions.label, "function");
assert.equal(sectionOptions.children["settings.general.item"].kind, "list");

const actionOptions = records.get("settings.action").entry;
assert.equal(actionOptions.id, "open-document");

// The shell's injected hooks project the settings.section ledger into rows.
const shellInjected = shellEntry.inject();
const rows = shellInjected.hooks.sections.getSnapshot();
const generalRow = rows.find((r) => r.id === "general");
assert.ok(generalRow, "general row must be in sections snapshot");
assert.equal(generalRow.order, 0);
assert.equal(generalRow.label, "通用设置");
assert.deepEqual(shellInjected.hooks.onboardingSteps.getSnapshot(), []);

rmSync(root, { recursive: true, force: true });
console.log("plugin check passed");
