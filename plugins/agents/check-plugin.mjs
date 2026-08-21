import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'pack-agents');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { slots: {}, webServer: {}, agentsPack: null };
plugin.apply(ctx);
assert.ok(ctx.agentsPack.initialized);
console.log('pack-agents check passed');
