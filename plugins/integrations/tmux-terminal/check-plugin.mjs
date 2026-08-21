import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'tmux-terminal');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { tmux: null, tools: {}, integrations: {}, webServer: {} };
plugin.apply(ctx);
assert.ok(ctx.tmux);
const s = ctx.tmux.createSession('main');
assert.strictEqual(s.name, 'main');
console.log('tmux-terminal check passed');
