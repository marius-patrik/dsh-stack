import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'tab-manager');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { tabManager: null, slots: {}, sessions: {}, webServer: {} };
plugin.apply(ctx);
assert.ok(ctx.tabManager);
ctx.tabManager.openTab({ id: 'tab1', type: 'chat', title: 'Main Chat' });
assert.strictEqual(ctx.tabManager.getActiveTab()?.title, 'Main Chat');
console.log('tab-manager check passed');
