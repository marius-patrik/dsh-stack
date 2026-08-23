import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'loops');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { loops: null, llm: {}, tools: {}, sessions: {} };
plugin.apply(ctx);
assert.ok(ctx.loops);
ctx.loops.startGoal('g1', 'Refactor monorepo');
assert.strictEqual(ctx.loops.getGoal('g1')?.status, 'running');
console.log('loops check passed');
