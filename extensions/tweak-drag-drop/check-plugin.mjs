import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape, stubSettingsService } from "../../scripts/plugin-check-kit.mjs";

const plugin = await import("./lib/index.js");

assertLoaderShape(plugin, "tweak-drag-drop");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// Boot over a stub settings service; the drag-drop section registers.
const ctx = new Context();
const { service: settings, registrations } = stubSettingsService();
ctx.provide("settings", settings);
plugin.apply(ctx, { enabled: true, maxImageBytes: 1024 });
await new Promise((resolve) => setTimeout(resolve, 50));

assert.ok(
  registrations.some((ns) => String(ns).includes("tweaks-drag-drop")),
  `tweaks-drag-drop namespace not registered: ${registrations.join(", ")}`,
);
console.log("boot ok");
console.log("plugin check passed");
