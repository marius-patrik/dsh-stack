import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'settings-dialog');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { slots: {}, locale: {} };
plugin.apply(ctx);
console.log('settings-dialog check passed');
