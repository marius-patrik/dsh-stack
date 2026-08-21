import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'code-editor');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { codeEditor: null, tools: {}, webServer: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.codeEditor);
ctx.codeEditor.open({ path: '/src/main.ts', content: 'console.log(1);' });
assert.strictEqual(ctx.codeEditor.getBuffer('/src/main.ts')?.content, 'console.log(1);');
console.log('code-editor check passed');
