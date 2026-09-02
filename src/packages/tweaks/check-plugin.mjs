import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import {
  assertClientInjectIsPackageIds,
  assertLoaderShape,
} from "../../scripts/plugin-check-kit.mjs";

const root = mkdtempSync(join(tmpdir(), "tweaks-"));
process.env.HOME = root;
process.env.DSH_HOME = join(root, ".agents");

const plugin = await import("./lib/index.js");
const { readTweaksSection, writeTweaksSection, normalizeSection, sectionsEqual } = await import(
  "./lib/mirror.js"
);

assertLoaderShape(plugin, "tweaks");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, "package.json"), "utf8"));
assertClientInjectIsPackageIds(manifest.dsh.client.inject, manifest.name);
console.log("dsh.client.inject is package ids ok:", JSON.stringify(manifest.dsh.client.inject));

const home = join(root, ".agents");
const base = {
  homeRoot: "/new/home",
  command: "web",
};

// Boot the plugin over a stub settings service.
const ctx = new Context();
const settingsRegistrations = [];
const settings = {
  /**
   * Registers a settings namespace.
   *
   * Guarantees that the provided namespace (`ns`) is added to `settingsRegistrations`.
   * Returns an object with `get` that returns the base option and `watch` that returns undefined.
   * Fails if the namespace is not added to `settingsRegistrations`.
   */
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
assert.equal(clientSpec.id, "@dsh-stack/tweaks");
assert.equal(typeof clientSpec.factory, "function");

const stubModules = {
  react: {},
  "@deepseek-ai/dsh-client-ui-primitives": {},
  "@deepseek-ai/dsh-client-ui-slots": {
    resolveSlotLabel: (label) => (typeof label === "function" ? label() : label),
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
  /**
   * Registers the given locale dictionaries under the specified namespace.
   *
   * @param {string} ns - The namespace under which to register the locale dictionaries.
   * @param {Object} dicts - The locale dictionaries to register.
   * @returns {void}
   * @throws Will throw an error if an unexpected `get` call is made.
   */
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
  /**
   * Returns the version number of the system.
   *
   * @returns {number} The version number.
   */
  getVersion() {
    return 1;
  },
  /**
   * Subscribes to receive updates for a specific entry.
   *
   * @returns {function} A subscription function that returns an unsubscribe function.
   */
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
    /**
     * Retrieves the current connection snapshot.
     *
     * Guarantees a connection object if the document is open and the connection is loopback.
     * Throws an error for any unexpected `name` other than "connection".
     */
    getSnapshot() {
      return { revision: localeRevision };
    },
    /**
     * Subscribes to a settings effect, executing the provided function with the current settings.
     * The function is called with the settings object, which includes `describe` and `openDocument`.
     * If the subscription is successful, the function is executed; otherwise, an error is thrown.
     */
    subscribe() {
      return () => {};
    },
  },
  layout: {
    /**
     * Toggles the sidebar visibility.
     *
     * The caller must ensure that the sidebar's visibility state is toggled between visible and hidden.
     * This function returns a function that hides the sidebar when called.
     * If the sidebar is already hidden, attempting to hide it again has no effect.
     */
    /**
     * Toggles the sidebar visibility.
     *
     * This function executes a side effect by calling the provided `fn` function.
     * It returns a cleanup function that can be used to revert the sidebar state.
     *
     * On failure, an error is thrown.
     */
    toggleSidebar() {},
  },
  workspaces: {
    /**
     * Retrieves the current locale snapshot.
     *
     * Guarantees a connection object if the document is open and the connection is loopback.
     * Throws an error for any unexpected `name` other than "connection".
     */
    /**
     * Subscribes to a settings effect, executing the provided function with the current settings.
     *
     * Guarantees the execution of the provided function with the current settings upon subscription.
     * Throws an error if the subscription is attempted with an unexpected name.
     */
    startSession() {},
  },
  slots: slotsStub,
};
clientModule.apply(ctxStub);

/**
 * Retrieves the current locale settings snapshot.
 *
 * Guarantees a connection object with the `revision` property if the locale is registered.
 * Throws an error if the locale is not registered or if the connection is not loopback.
 */
const assertRegistered = (name, reason) =>
  assert.ok(records.has(name), `${reason}: ${name} not registered`);
// @dsh-stack/sidebar-shell is the canonical declarer of the `sidebar` slot and
// its children. Two entries may not declare the same child slot, so tweaks must
// not register a `sidebar` root of its own -- doing so made the client loader
// throw `slot "sidebar.workspaces" is already declared` and the web UI failed
// to boot. tweaks still owns the settings shell, which seats into the
// `sidebar.settings` slot that sidebar-shell declares.
assert.ok(
  !records.has("sidebar"),
  "tweaks must not re-declare the sidebar root (sidebar-shell owns it)",
);
assert.ok(
  !records.has("sidebar.newSession"),
  "tweaks must not register sidebar.newSession (it belonged to the removed sidebar root)",
);
assertRegistered("sidebar.settings", "Phase A");
assertRegistered("settings.trigger", "Phase A");
assertRegistered("settings.header", "Phase A");
assertRegistered("settings.close", "Phase A");
assertRegistered("settings.action", "Phase A");
assertRegistered("settings.section", "Phase A");
assert.ok(localeEntries.has("sidebar"), "sidebar dictionaries not registered");
assert.ok(localeEntries.has("settings"), "settings dictionaries not registered");

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

// tweaks shadows client-ui-settings-models' "welcome-notice"
// settings.onboarding entry (same id, lower priority) so the "Internal
// Testing Notice" toggle actually gates it -- see issue #233.
const onboardingRec = allRecords.find(
  (r) => r.entry.name === "settings.onboarding" && r.entry.id === "welcome-notice",
);
assert.ok(onboardingRec, "welcome-notice onboarding override must be registered");
assert.equal(onboardingRec.entry.priority, -10);
assert.equal(onboardingRec.entry.order, -100);
assert.equal(typeof onboardingRec.component, "function");
assert.deepEqual(shellInjected.hooks.onboardingSteps.getSnapshot(), [
  { id: "welcome-notice", order: -100 },
]);

rmSync(root, { recursive: true, force: true });
console.log("plugin check passed");
