import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'terminal-client');
assert.strictEqual(typeof plugin.apply, 'function');
console.log('terminal-client check passed');
