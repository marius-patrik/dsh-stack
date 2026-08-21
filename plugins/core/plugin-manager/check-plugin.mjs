import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'plugin-manager');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));
assert.strictEqual(plugin.default, undefined);

const ctx = { plugins: null, webServer: {}, slots: {} };
plugin.apply(ctx, {});
assert.ok(ctx.plugins);
ctx.plugins.register({ name: 'test-plugin', version: '1.0.0', inject: [], optional: [], status: 'active' });
assert.strictEqual(ctx.plugins.get('test-plugin')?.name, 'test-plugin');
console.log('plugin-manager check passed');
