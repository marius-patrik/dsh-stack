import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "code-server");
assert.strictEqual(typeof plugin.apply, "function");
assert.ok(Array.isArray(plugin.inject));

const emitted = [];
const ctx = {
  codeServer: null,
  integrations: {},
  webServer: {},
  slots: {},
  emit: (event, data) => emitted.push({ event, data }),
};

plugin.apply(ctx, { port: 9000 });
assert.ok(ctx.codeServer);

// 1. Check initial status
const initStatus = ctx.codeServer.getStatus();
assert.strictEqual(initStatus.running, false);
assert.strictEqual(initStatus.port, 9000);

// 2. Start server
const startRes = await ctx.codeServer.startServer();
assert.strictEqual(startRes.running, true);
assert.strictEqual(emitted.length, 1);
assert.strictEqual(emitted[0].event, "code-server:started");

// 3. Stop server
const stopRes = await ctx.codeServer.stopServer();
assert.strictEqual(stopRes, true);
assert.strictEqual(ctx.codeServer.getStatus().running, false);

console.log("integrations/code-server complete verification passed");
