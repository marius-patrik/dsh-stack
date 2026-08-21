import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'vault-credentials');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { accounts: null, webServer: {} };
plugin.apply(ctx);
assert.ok(ctx.accounts);
ctx.accounts.set({ accountName: 'default', provider: 'anthropic', tokenRef: 'CLAUDE_OAUTH' });
assert.strictEqual(ctx.accounts.get('default')?.provider, 'anthropic');
console.log('vault-credentials check passed');
