import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'pack-direct-providers');
assert.strictEqual(typeof plugin.apply, 'function');
console.log('pack-direct-providers check passed');
