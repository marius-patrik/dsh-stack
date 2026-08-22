import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'tools');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));

const emitted = [];
const ctx = {
  tools: null,
  webServer: {},
  slots: {},
  emit: (event, data) => emitted.push({ event, data })
};

plugin.apply(ctx, {});
assert.ok(ctx.tools);

// 1. Tool registration & event broadcast
ctx.tools.registerTool({
  name: 'read_file',
  description: 'Read file from disk',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path' }
    },
    required: ['path']
  },
  execute: async (params) => `content of ${params.path}`
});

assert.strictEqual(ctx.tools.hasTool('read_file'), true);
assert.strictEqual(ctx.tools.getTool('read_file')?.description, 'Read file from disk');
assert.strictEqual(emitted.length, 1);
assert.strictEqual(emitted[0].event, 'tools:registered');

// 2. Tool execution
const res = await ctx.tools.executeTool('read_file', { path: '/test.txt' });
assert.strictEqual(res, 'content of /test.txt');

// 3. Error on unknown tool
let errored = false;
try {
  await ctx.tools.executeTool('non_existent', {});
} catch (e) {
  errored = true;
  assert.ok(e.message.includes('non_existent'));
}
assert.strictEqual(errored, true);

// 4. MCP server registration
ctx.tools.registerMcpServer('github-mcp', 'http://localhost:3001/mcp', ['gh_pr_list', 'gh_issue_view']);
const mcpList = ctx.tools.listMcpServers();
assert.strictEqual(mcpList.length, 1);
assert.strictEqual(mcpList[0].id, 'github-mcp');
assert.strictEqual(mcpList[0].tools.length, 2);

// 5. Tool unregistration
assert.strictEqual(ctx.tools.unregisterTool('read_file'), true);
assert.strictEqual(ctx.tools.hasTool('read_file'), false);

console.log('agents/tools complete verification passed');
