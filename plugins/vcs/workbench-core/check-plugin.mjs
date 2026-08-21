import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'workbench-core');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));

const registeredTools = new Map();
const mockTools = {
  registerTool: (tool) => { registeredTools.set(tool.name, tool); },
  getTool: (name) => registeredTools.get(name)
};

const ctx = {
  repos: null,
  tools: mockTools,
  webServer: {}
};

plugin.apply(ctx, {});
assert.ok(ctx.repos);

// 1. Assert tool bundling
assert.ok(registeredTools.has('git_status'));
assert.ok(registeredTools.has('git_diff'));
assert.ok(registeredTools.has('git_commit'));

// 2. Test local offline repo overview
const overview = ctx.repos.getOverview(process.cwd());
assert.ok(overview.path);
assert.ok(overview.branch);
assert.strictEqual(typeof overview.uncommittedChanges, 'number');

// 3. Test git_status tool execution
const statusTool = registeredTools.get('git_status');
const statusRes = await statusTool.execute({ path: process.cwd() });
assert.ok(statusRes.isLocal);
assert.strictEqual(typeof statusRes.status, 'string');

// 4. Test git_diff tool execution
const diffTool = registeredTools.get('git_diff');
const diffRes = await diffTool.execute({ path: process.cwd() });
assert.strictEqual(typeof diffRes.diff, 'string');

console.log('vcs/workbench-core complete verification passed');
