import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'icon-pack-lucide');
assert.strictEqual(typeof plugin.apply, 'function');

const registered = [];
const ctx = { icons: { registerPack: (p) => registered.push(p) } };
plugin.apply(ctx);
assert.strictEqual(registered.length, 1);
assert.strictEqual(registered[0].id, 'lucide-animated');
console.log('icon-pack-lucide check passed');
