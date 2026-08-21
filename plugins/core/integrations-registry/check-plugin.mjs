import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'integrations-registry');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));

const ctx = { integrations: null, webServer: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.integrations);
ctx.integrations.register({ id: 'tmux', name: 'tmux Terminal', category: 'sandbox', installed: true, status: 'online' });
assert.strictEqual(ctx.integrations.get('tmux')?.name, 'tmux Terminal');
console.log('integrations-registry check passed');
