import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "docker-sandbox");
assert.strictEqual(typeof plugin.apply, "function");
console.log("docker-sandbox check passed");
