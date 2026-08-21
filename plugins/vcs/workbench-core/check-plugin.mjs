import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'workbench-core');
assert.strictEqual(typeof plugin.apply, 'function');

const ctx = { repos: null, tools: {}, webServer: {} };
plugin.apply(ctx);
assert.ok(ctx.repos);
ctx.repos.registerRepo({ path: '/repo', branch: 'main', isLocalOnly: true });
assert.strictEqual(ctx.repos.getRepo('/repo')?.branch, 'main');
console.log('workbench-core check passed');
