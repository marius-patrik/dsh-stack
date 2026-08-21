import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'pack-vcs');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { slots: {}, webServer: {}, vcsPack: null };
plugin.apply(ctx);
assert.ok(ctx.vcsPack.initialized);
console.log('pack-vcs check passed');
