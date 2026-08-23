import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "skills");
assert.strictEqual(typeof plugin.apply, "function");

const ctx = { skills: null, tools: {} };
plugin.apply(ctx);
assert.ok(ctx.skills);
ctx.skills.loadSkill("pr-review");
assert.strictEqual(ctx.skills.hasSkill("pr-review"), true);
console.log("skills check passed");
