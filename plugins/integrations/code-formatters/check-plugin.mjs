import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'code-formatters');
assert.strictEqual(typeof plugin.apply, 'function');
console.log('code-formatters check passed');
