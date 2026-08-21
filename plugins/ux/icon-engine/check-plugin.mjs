import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'icon-engine');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { icons: null, webServer: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.icons);
ctx.icons.setMapping('ts', 'typescript');
assert.strictEqual(ctx.icons.resolveIcon('app.ts'), 'typescript');
console.log('icon-engine check passed');
