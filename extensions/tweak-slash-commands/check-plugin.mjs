// jscpd:ignore-start -- per-package check-plugin.mjs scaffolding, duplicated by design across sibling extensions
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape, stubSettingsService } from "../../scripts/plugin-check-kit.mjs";

const plugin = await import("./lib/index.js");
const { validateCommand, installConfiguredCommands } = await import("./lib/commands.js");

assertLoaderShape(plugin, "tweak-slash-commands");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// Validators.
validateCommand({ name: "ping", description: "x", reply: "pong" });
assert.throws(() => validateCommand({ name: "Ping", description: "x", reply: "pong" }));
assert.throws(() => validateCommand({ name: "/ping", description: "x", reply: "pong" }));
assert.throws(() => validateCommand({ name: "ping", description: "x", reply: "  " }));
console.log("validators ok");

// Boot over stub settings + commands services; the config-file command is
// bridged into the harness command registry on section change.
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
const commands = {
  enabled: true,
  commands: [{ name: "ping", description: "echo", reply: "pong" }],
};
plugin.apply(ctx, commands);
await new Promise((resolve) => setTimeout(resolve, 50));

assert.ok(
  registrations.some((ns) => String(ns).includes("tweaks-commands")),
  `tweaks-commands namespace not registered: ${registrations.join(", ")}`,
);
installConfiguredCommands(ctx, commands);
await new Promise((resolve) => setTimeout(resolve, 50));
const names = registered.map((entry) => entry.name);
assert.ok(names.includes("ping"), `config command not registered: ${JSON.stringify(registered)}`);
console.log("command registrations ok:", names.join(", "));
console.log("plugin check passed");

// jscpd:ignore-end
