import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "personas");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = { personas: null, llm: {}, sessions: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.personas);
ctx.personas.register({
  id: "coder",
  name: "Code Expert",
  role: "developer",
  systemPrompt: "Write clean code.",
});
assert.strictEqual(ctx.personas.get("coder")?.name, "Code Expert");
console.log("personas check passed");
