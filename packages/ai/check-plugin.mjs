import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'pack-ai');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { aiPack: null };
plugin.apply(ctx);
assert.ok(ctx.aiPack.initialized);
console.log('pack-ai check passed');
