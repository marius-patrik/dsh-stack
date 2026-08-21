import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'sidebar-tree');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));

const ctx = { slots: {}, sessions: {} };
plugin.apply(ctx);
console.log('sidebar-tree check passed');
