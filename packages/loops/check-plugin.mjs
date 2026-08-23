import assert from "node:assert/strict";
import * as plugin from "./lib/index.js";

assert.equal(plugin.name, "dsh-loops");
assert.equal(typeof plugin.apply, "function");
assert.ok(Array.isArray(plugin.inject));
assert.ok(!("default" in plugin), "no default export");

console.log("loader shape ok: dsh-loops inject=", JSON.stringify(plugin.inject));
console.log("plugin check passed");
