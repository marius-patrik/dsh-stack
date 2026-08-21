import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'translator');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { translator: null, dialects: {}, llm: {} };
plugin.apply(ctx);
assert.ok(ctx.translator);
console.log('translator check passed');
