import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'github-cli');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { tmux: {} };
plugin.apply(ctx);
console.log('github-cli check passed');
