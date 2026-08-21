import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'code-server');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { codeServer: null, integrations: {}, webServer: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.codeServer);
console.log('code-server check passed');
