import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "npm-cli");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = { tmux: {} };
plugin.apply(ctx);
console.log("npm-cli check passed");
