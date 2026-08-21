import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'providers-registry');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));
assert.strictEqual(plugin.default, undefined);

const ctx = { providers: null, quotas: null, accounts: {}, dialects: {} };
plugin.apply(ctx);
assert.ok(ctx.providers);
assert.ok(ctx.quotas);
ctx.providers.registerRoute({ id: 'claude-sub', name: 'Claude Code', type: 'subscription', models: ['claude-opus-5'], status: 'available' });
assert.strictEqual(ctx.providers.getRoute('claude-sub')?.name, 'Claude Code');
console.log('providers-registry check passed');
