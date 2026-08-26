// jscpd:ignore-start -- per-package check-plugin.mjs scaffolding, duplicated by design across sibling extensions
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape, stubSettingsService } from "../../scripts/plugin-check-kit.mjs";

const plugin = await import("./lib/index.js");
const { forkSession } = await import("./lib/fork-undo.js");

assertLoaderShape(plugin, "tweak-fork-undo");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// Fork helper.
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
const undoResult = forkSession(sessionsStub, agent, -1);
assert.equal(undoResult.kind, "success");
assert.equal(forks[0].seed.length, 2);
const redoResult = forkSession(sessionsStub, agent, 1);
assert.equal(forks[1].seed.length, 3);
const emptyResult = forkSession(sessionsStub, { session: { events: [] } }, -1);
assert.equal(emptyResult.kind, "error");
console.log("fork helper ok");

// Boot over stub settings + commands + sessions services.
const ctx = new Context();
const { service: settings, registrations } = stubSettingsService();
ctx.provide("settings", settings);
const registered = [];
ctx.provide("commands", {
  /** register implementation. */
  register(def) {
    registered.push({ name: def.name, description: def.description });
    return () => undefined;
  },
});
ctx.provide("sessions", sessionsStub);
plugin.apply(ctx, { enabled: true });
await new Promise((resolve) => setTimeout(resolve, 50));
assert.ok(
  registrations.some((ns) => String(ns).includes("tweaks-fork-undo")),
  `tweaks-fork-undo namespace not registered: ${registrations.join(", ")}`,
);
const names = registered.map((entry) => entry.name);
assert.ok(names.includes("undo"), `undo not registered: ${JSON.stringify(registered)}`);
assert.ok(names.includes("redo"), `redo not registered: ${JSON.stringify(registered)}`);
console.log("undo/redo registrations ok:", names.join(", "));
console.log("plugin check passed");

// jscpd:ignore-end