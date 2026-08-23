import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'keybindings');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { slots: {}, keybindings: null };
plugin.apply(ctx);
assert.ok(ctx.keybindings);
ctx.keybindings.register({ id: 'save', label: 'Save File', keys: 'Meta+S', action: () => {} });
assert.strictEqual(ctx.keybindings.get('save')?.keys, 'Meta+S');
console.log('keybindings check passed');
