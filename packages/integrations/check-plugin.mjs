import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'pack-integrations');
assert.strictEqual(typeof plugin.apply, 'function');
console.log('pack-integrations check passed');
