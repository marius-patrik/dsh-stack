import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "tmux-terminal");
assert.strictEqual(typeof plugin.apply, "function");
assert.ok(Array.isArray(plugin.inject));

const registeredTools = new Map();
const mockTools = {
  registerTool: (tool) => {
    registeredTools.set(tool.name, tool);
  },
  getTool: (name) => registeredTools.get(name),
};

const emitted = [];
const ctx = {
  tmux: null,
  tools: mockTools,
  integrations: {},
  webServer: {},
  emit: (event, data) => emitted.push({ event, data }),
};

plugin.apply(ctx, {});
assert.ok(ctx.tmux);

// 1. Assert tool bundling
assert.ok(registeredTools.has("tmux_spawn_session"));
assert.ok(registeredTools.has("tmux_send_input"));
assert.ok(registeredTools.has("tmux_capture_output"));

// 2. Test tmux_spawn_session tool
const spawnTool = registeredTools.get("tmux_spawn_session");
const spawnRes = await spawnTool.execute({ name: "build-term", command: "bun run test" });
assert.ok(spawnRes.id);
assert.strictEqual(spawnRes.name, "build-term");

// 3. Test tmux_send_input tool
const sendTool = registeredTools.get("tmux_send_input");
const sendRes = await sendTool.execute({ id: spawnRes.id, input: 'echo "hello from tmux"' });
assert.strictEqual(sendRes.success, true);

// 4. Test tmux_capture_output tool
const capTool = registeredTools.get("tmux_capture_output");
const capRes = await capTool.execute({ id: spawnRes.id });
assert.ok(capRes.output.includes("hello from tmux"));

// 5. Test session listing & kill
const list = ctx.tmux.listSessions();
assert.strictEqual(list.length, 1);
assert.strictEqual(ctx.tmux.killSession(spawnRes.id), true);
assert.strictEqual(ctx.tmux.listSessions().length, 0);

console.log("integrations/tmux-terminal complete verification passed");
