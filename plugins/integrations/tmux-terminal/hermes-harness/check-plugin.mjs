import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'hermes-harness');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { tmux: {} };
plugin.apply(ctx);
console.log('hermes-harness check passed');
