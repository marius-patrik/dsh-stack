import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'actions');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { actions: null, llm: {}, tools: {}, sessions: {} };
plugin.apply(ctx);
assert.ok(ctx.actions);
ctx.actions.setAction('sess1', 'code');
assert.strictEqual(ctx.actions.getAction('sess1')?.mode, 'code');
console.log('actions check passed');
