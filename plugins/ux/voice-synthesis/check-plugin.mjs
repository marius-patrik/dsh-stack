import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "voice-synthesis");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = { voice: null, webServer: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.voice);
assert.strictEqual(ctx.voice.speak("hello"), true);
console.log("voice-synthesis check passed");
