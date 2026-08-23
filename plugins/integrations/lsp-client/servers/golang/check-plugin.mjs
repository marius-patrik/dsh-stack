import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "lsp-server-golang");
assert.strictEqual(typeof plugin.apply, "function");

let registered = null;
const ctx = {
  lsp: {
    registerServer: (l, s) => {
      registered = s;
    },
  },
  tools: {},
};
plugin.apply(ctx);
assert.ok(registered);
console.log("lsp-server-golang check passed");
