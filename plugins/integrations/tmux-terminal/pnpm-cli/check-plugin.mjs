import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "pnpm-cli");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = { tmux: {} };
plugin.apply(ctx);
console.log("pnpm-cli check passed");
