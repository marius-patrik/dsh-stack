import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'pack-ux');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { slots: {}, webServer: {}, ux: null };
plugin.apply(ctx);
assert.ok(ctx.ux.initialized);
console.log('pack-ux check passed');
