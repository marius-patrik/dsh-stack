import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'lsp-client');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));

const registeredTools = new Map();
const mockTools = {
  registerTool: (tool) => { registeredTools.set(tool.name, tool); },
  getTool: (name) => registeredTools.get(name)
};

const emitted = [];
const ctx = {
  lsp: null,
  tools: mockTools,
  integrations: {},
  webServer: {},
  emit: (event, data) => emitted.push({ event, data })
};

plugin.apply(ctx, {});
assert.ok(ctx.lsp);

// 1. Assert required tools registered into ctx.tools
assert.ok(registeredTools.has('lsp_hover'));
assert.ok(registeredTools.has('lsp_definition'));
assert.ok(registeredTools.has('lsp_diagnostics'));

// 2. Register mock TypeScript language server
ctx.lsp.registerServer('ts', {
  name: 'vtsls',
  languages: ['ts', 'tsx', 'js', 'jsx'],
  getHover: async (uri, pos) => ({ contents: 'function main(): void', range: { start: pos, end: pos } }),
  getDefinition: async (uri, pos) => [{ uri, range: { start: { line: 10, character: 0 }, end: { line: 10, character: 10 } } }],
  getDiagnostics: async (uri) => [
    { range: { start: { line: 5, character: 2 }, end: { line: 5, character: 8 } }, severity: 1, message: 'Type error: number not assignable to string' }
  ]
});

// 3. Test lsp_hover tool
const hoverTool = registeredTools.get('lsp_hover');
const hoverRes = await hoverTool.execute({ path: 'src/app.ts', line: 5, character: 4 });
assert.strictEqual(hoverRes.contents, 'function main(): void');

// 4. Test lsp_diagnostics tool & cache
const diagTool = registeredTools.get('lsp_diagnostics');
const diagRes = await diagTool.execute({ path: 'src/app.ts' });
assert.strictEqual(diagRes.length, 1);
assert.strictEqual(diagRes[0].severity, 1);
assert.ok(diagRes[0].message.includes('Type error'));

// 5. Test lsp_definition tool
const defTool = registeredTools.get('lsp_definition');
const defRes = await defTool.execute({ path: 'src/app.ts', line: 5, character: 4 });
assert.strictEqual(defRes.length, 1);
assert.strictEqual(defRes[0].range.start.line, 10);

console.log('integrations/lsp-client complete verification passed');
