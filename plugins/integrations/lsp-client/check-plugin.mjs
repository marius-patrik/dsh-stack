import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'lsp-client');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { lsp: null, tools: {}, integrations: {}, webServer: {} };
plugin.apply(ctx);
assert.ok(ctx.lsp);
console.log('lsp-client check passed');
