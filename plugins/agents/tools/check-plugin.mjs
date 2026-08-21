import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'tools');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { tools: null, webServer: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.tools);
ctx.tools.registerTool({ name: 'read_file', description: 'Read file', parameters: {}, execute: () => 'content' });
assert.strictEqual(ctx.tools.getTool('read_file')?.description, 'Read file');
console.log('tools check passed');
