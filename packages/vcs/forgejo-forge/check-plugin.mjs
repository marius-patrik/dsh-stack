import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "forgejo-forge");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = {};
["repos", "accounts", "tools"].forEach((k) => {
  ctx[k] = {};
});
plugin.apply(ctx);
console.log("forgejo-forge check passed");
