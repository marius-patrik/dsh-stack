import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'protocol-dialects');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { dialects: null };
plugin.apply(ctx);
assert.ok(ctx.dialects);
ctx.dialects.register('openai', { name: 'openai', serializeRequest: (b) => b, parseStreamChunk: (c) => c });
assert.strictEqual(ctx.dialects.get('openai')?.name, 'openai');
console.log('protocol-dialects check passed');
