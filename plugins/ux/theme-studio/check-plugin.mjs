import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'theme-studio');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { themeStudio: null, webServer: {}, slots: {} };
plugin.apply(ctx);
assert.ok(ctx.themeStudio);
ctx.themeStudio.registerTheme({ id: 'oled', name: 'OLED Pitch Black', type: 'oled', colors: {} });
ctx.themeStudio.setTheme('oled');
assert.strictEqual(ctx.themeStudio.getActiveTheme(), 'oled');
console.log('theme-studio check passed');
