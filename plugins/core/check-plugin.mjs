import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'pack-core');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { slots: {}, webServer: {}, core: null };
plugin.apply(ctx);
assert.ok(ctx.core.initialized);
console.log('pack-core check passed');
