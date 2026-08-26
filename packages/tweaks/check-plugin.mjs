import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape } from "../../scripts/plugin-check-kit.mjs";

const root = mkdtempSync(join(tmpdir(), "tweaks-"));
process.env.HOME = root;
process.env.DSH_HOME = join(root, ".agents");

const plugin = await import("./lib/index.js");
const { readTweaksSection, writeTweaksSection, normalizeSection, sectionsEqual } = await import(
  "./lib/mirror.js"
);

assertLoaderShape(plugin, "tweaks");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

const home = join(root, ".agents");
const base = {
  homeRoot: "/new/home",
  command: "web",
};

// Boot the plugin over a stub settings service.
const ctx = new Context();
const settingsRegistrations = [];
const settings = {
  /** register implementation. */
  register(ns, _schema, opts) {
    settingsRegistrations.push(ns);
    return { get: () => opts.base, watch: () => undefined };
  },
};
ctx.provide("settings", settings);
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

// The ui-onboarding namespace ui-settings-general used to own is registered.
assert.ok(
  settingsRegistrations.some((ns) => String(ns).includes("ui-onboarding")),
  `ui-onboarding namespace not registered: ${settingsRegistrations.join(", ")}`,
);
console.log("ui-onboarding registration ok");

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
console.log("mirror helpers ok");

// Phase A: the browser half (lib/client.js) is the take-over bundle for the
// `sidebar` + `sidebar.settings` shells. It is hand-authored and copies the
// platform seed words the raw bundle require()s, so the check captures the
// factory, drives it with stub modules, and asserts the registrations the
// harness browser loads at runtime.
const clientPath = join(import.meta.dirname, "lib", "client.js");
assert.ok(existsSync(clientPath), "lib/client.js missing — run `npm run build`");
const cryptoPolyfill = readFileSync(
  join(import.meta.dirname, "..", "..", "scripts", "client-runtime", "crypto-polyfill.js"),
  "utf8",
);
const glyphFactory = readFileSync(
  join(import.meta.dirname, "..", "..", "scripts", "client-runtime", "glyph-factory.js"),
  "utf8",
);
const rootClient = readFileSync(join(import.meta.dirname, "client.js"), "utf8");
const builtClient = readFileSync(clientPath, "utf8");
assert.equal(
  builtClient,
  cryptoPolyfill + glyphFactory + rootClient,
  "lib/client.js must be the shared crypto polyfill + glyph factory + client.js",
);

globalThis.window = {
  __ModuleLoader__: {
    load: (spec) => {
      globalThis.__clientSpec = spec;
    },
  },
};
await import("./lib/client.js");
const clientSpec = globalThis.__clientSpec;
assert.equal(clientSpec.id, "tweaks");
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
const /** stubRequire implementation. */ stubRequire = (name) => stubModules[name];
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
  layout: {
    /** toggleSidebar implementation. */
    /** toggleSidebar implementation. */
    toggleSidebar() {},
  },
  workspaces: {
    /** startSession implementation. */
    /** startSession implementation. */
    startSession() {},
  },
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
