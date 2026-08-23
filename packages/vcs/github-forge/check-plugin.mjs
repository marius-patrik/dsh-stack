import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "github-forge");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = {};
["github-cli", "repos", "accounts"].forEach((k) => {
  ctx[k] = {};
});
plugin.apply(ctx);
console.log("github-forge check passed");
