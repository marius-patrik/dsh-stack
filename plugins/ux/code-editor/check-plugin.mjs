import assert from "node:assert";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "code-editor");
assert.strictEqual(typeof plugin.apply, "function");
assert.ok(Array.isArray(plugin.inject));

const listeners = new Map();
const emitted = [];
const ctx = {
  codeEditor: null,
  tools: {},
  webServer: {},
  slots: {},
  on: (event, handler) => {
    listeners.set(event, handler);
  },
  emit: (event, data) => emitted.push({ event, data }),
};

plugin.apply(ctx, {});
assert.ok(ctx.codeEditor);

// 1. Open buffer & language detection
const buf = ctx.codeEditor.openBuffer("src/main.ts", "const x: number = 42;");
assert.strictEqual(buf.path, "src/main.ts");
assert.strictEqual(buf.language, "typescript");
assert.strictEqual(buf.dirty, false);
assert.strictEqual(ctx.codeEditor.getActiveBuffer()?.path, "src/main.ts");

// 2. Modify content & assert dirty state
ctx.codeEditor.updateContent("src/main.ts", 'const x: string = "hello";');
assert.strictEqual(ctx.codeEditor.getBuffer("src/main.ts")?.dirty, true);

// 3. Save buffer
assert.strictEqual(ctx.codeEditor.saveBuffer("src/main.ts"), true);
assert.strictEqual(ctx.codeEditor.getBuffer("src/main.ts")?.dirty, false);

// 4. Test LSP diagnostic marker update event
const lspHandler = listeners.get("lsp:diagnostics");
assert.ok(typeof lspHandler === "function");
lspHandler({
  filePath: "src/main.ts",
  diagnostics: [
    {
      range: { start: { line: 1, character: 7 }, end: { line: 1, character: 8 } },
      severity: 1,
      message: "Type error",
    },
  ],
});
assert.strictEqual(ctx.codeEditor.getBuffer("src/main.ts")?.markers.length, 1);
assert.strictEqual(ctx.codeEditor.getBuffer("src/main.ts")?.markers[0].severity, "error");

// 5. Close buffer
ctx.codeEditor.closeBuffer("src/main.ts");
assert.strictEqual(ctx.codeEditor.getBuffer("src/main.ts"), undefined);

console.log("ux/code-editor complete verification passed");
