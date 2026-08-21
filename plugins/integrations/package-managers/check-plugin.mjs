import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'package-managers');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { packageManagers: null, tools: {}, integrations: {}, webServer: {} };
plugin.apply(ctx);
assert.ok(ctx.packageManagers);
assert.strictEqual(ctx.packageManagers.detect('/app')[0].type, 'pnpm');
console.log('package-managers check passed');
