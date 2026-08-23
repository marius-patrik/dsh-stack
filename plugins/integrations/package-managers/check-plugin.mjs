import assert from "node:assert";
import * as path from "node:path";
import * as plugin from "./lib/index.js";

assert.strictEqual(plugin.name, "package-managers");
assert.strictEqual(typeof plugin.apply, "function");
assert.ok(Array.isArray(plugin.inject));

const registeredTools = new Map();
const mockTools = {
  registerTool: (tool) => {
    registeredTools.set(tool.name, tool);
  },
  getTool: (name) => registeredTools.get(name),
};

const ctx = {
  packageManagers: null,
  tools: mockTools,
  integrations: {},
  webServer: {},
};

plugin.apply(ctx, {});
assert.ok(ctx.packageManagers);

// 1. Assert tool bundling
assert.ok(registeredTools.has("run_package_script"));
assert.ok(registeredTools.has("install_package"));
assert.ok(registeredTools.has("switch_node_version"));

// 2. Test detection in harness (pnpm-lock.yaml)
const harnessDir = path.resolve(process.cwd(), "../../../harness");
const detectedHarness = ctx.packageManagers.detect(harnessDir);
assert.ok(detectedHarness.length > 0);
assert.strictEqual(detectedHarness[0].type, "pnpm");
assert.strictEqual(detectedHarness[0].command, "pnpm");

// 3. Test run_package_script tool execution
const runTool = registeredTools.get("run_package_script");
const runRes = await runTool.execute({ script: "build", path: harnessDir });
assert.strictEqual(runRes.command, "pnpm run build");
assert.strictEqual(runRes.manager, "pnpm");

// 4. Test install_package tool execution
const installTool = registeredTools.get("install_package");
const installRes = await installTool.execute({
  packages: "lucide-react",
  dev: true,
  path: harnessDir,
});
assert.strictEqual(installRes.command, "pnpm add -D lucide-react");

// 5. Test package.json fallback in subpackage
const detectedSub = ctx.packageManagers.detect(process.cwd());
assert.ok(detectedSub.length > 0);
assert.strictEqual(detectedSub[0].command, "npm");

console.log("integrations/package-managers complete verification passed");
