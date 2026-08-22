import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'git-driver');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = {};
["git-cli","repos","tools"].forEach(k => { ctx[k] = {}; });
plugin.apply(ctx);
console.log('git-driver check passed');
