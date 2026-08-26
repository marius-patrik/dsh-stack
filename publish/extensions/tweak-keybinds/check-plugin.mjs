import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape, stubSettingsService } from "../../scripts/plugin-check-kit.mjs";

const plugin = await import("./lib/index.js");
const { validateKeybinds } = await import("./lib/keybinds.js");

assertLoaderShape(plugin, "tweak-keybinds");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// Validators.
validateKeybinds([{ action: "undo", keys: "mod+z" }]);
assert.throws(() => validateKeybinds([{ action: "undo", keys: " " }]));
assert.throws(() =>
  validateKeybinds([
    { action: "undo", keys: "mod+z" },
    { action: "undo", keys: "alt+z" },
  ]),
);
console.log("validators ok");

// Boot over a stub settings service.
const ctx = new Context();
const { service: settings, registrations } = stubSettingsService();
ctx.provide("settings", settings);
plugin.apply(ctx, { enabled: true, keymap: [{ action: "undo", keys: "mod+z", when: "" }] });
await new Promise((resolve) => setTimeout(resolve, 50));

assert.ok(
  registrations.some((ns) => String(ns).includes("tweaks-keybinds")),
  `tweaks-keybinds namespace not registered: ${registrations.join(", ")}`,
);
console.log("boot ok");
console.log("plugin check passed");
