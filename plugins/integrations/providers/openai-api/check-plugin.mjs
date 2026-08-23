import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "openai-api");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = { providers: {}, accounts: {}, dialects: {} };
plugin.apply(ctx);
console.log("openai-api check passed");
