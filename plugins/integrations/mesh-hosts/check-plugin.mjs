import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'mesh-hosts');
assert.strictEqual(typeof plugin.apply, 'function');
console.log('mesh-hosts check passed');
