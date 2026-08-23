import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "sapling-driver");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = {};
["sapling-cli", "repos", "tools"].forEach((k) => {
  ctx[k] = {};
});
plugin.apply(ctx);
console.log("sapling-driver check passed");
