// jscpd:ignore-start -- per-package check-plugin.mjs scaffolding, duplicated by design across sibling packages
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape, stubSpawnSyncSubprocess } from "../../scripts/plugin-check-kit.mjs";

const root = mkdtempSync(join(tmpdir(), "agent-tools-"));

const plugin = await import("./lib/index.js");
const { NS, ToolSettings } = await import("./lib/settings.js");
const { toolsFor, substitutePlaceholder, commandArgv } = await import("./lib/settings.js");

assertLoaderShape(plugin, "agent-tools");
assert.equal(NS, "agent-tools");
assert.equal(plugin.inject.join(","), "subprocess,tools");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// settings helpers: merge precedence + placeholder substitution.
assert.deepEqual(toolsFor(undefined, { tools: { a: { description: "d", command: ["x"] } } }), {
  a: { description: "d", command: ["x"] },
});
assert.deepEqual(
  toolsFor(
    { tools: { a: { description: "from-settings", command: ["s"] } } },
    { tools: { a: { description: "from-entry", command: ["e"] } } },
  ),
  { a: { description: "from-settings", command: ["s"] } },
);
assert.equal(substitutePlaceholder("--name {name} {missing}", { name: "alice" }), "--name alice ");
assert.equal(substitutePlaceholder("{count}", { count: 3 }), "3");
assert.equal(substitutePlaceholder("{flag}", { flag: true }), "true");
assert.equal(substitutePlaceholder("no placeholders", { x: 1 }), "no placeholders");
assert.deepEqual(
  commandArgv(
    { command: ["node", "{script}", "--out", "{out}"] },
    { script: "a.js", out: "b.txt" },
  ),
  ["node", "a.js", "--out", "b.txt"],
);
console.log("settings helpers ok");

// apply: registers each configured tool over a stub settings/tools surface.
const sections = new Map([
  [
    NS,
    {
      tools: {
        "echo-name": {
          description: "Echo the name argument",
          parameters: { name: { type: "string", required: true } },
          command: [process.execPath, "-e", "process.stdout.write(process.argv[1])", "{name}"],
        },
        "fail-loud": {
          description: "A command that exits nonzero",
          command: [process.execPath, "-e", 'process.stderr.write("boom");process.exit(3)'],
        },
        "optional-param": {
          description: "A tool with an optional number parameter",
          parameters: { count: { type: "number" } },
          command: [
            process.execPath,
            "-e",
            "process.stdout.write(String(process.argv[1]))",
            "{count}",
          ],
        },
      },
    },
  ],
]);
const actx = new Context();
actx.provide("settings", {
  get: (ns) => sections.get(ns),
  /** register implementation. */
  register(_ns, _schema, opts) {
    if (!sections.has(_ns)) sections.set(_ns, opts.base);
    return { get: (ns) => sections.get(ns), watch: () => undefined };
  },
});
const registeredTools = [];
actx.provide("tools", {
  register: (def) => {
    registeredTools.push(def);
    return () => {};
  },
});
actx.subprocess = stubSpawnSyncSubprocess();
actx.logger = { info: () => {}, warn: (m) => console.log("WARN:", m) };
actx.on = () => () => {};
plugin.apply(actx, {});
await new Promise((resolve) => setTimeout(resolve, 50));
const names = registeredTools.map((t) => t.name).sort();
assert.deepEqual(names, ["echo-name", "fail-loud", "optional-param"]);
console.log("apply wiring ok (3 custom tools registered)");

// execute: real subprocess round-trip with placeholder substitution.
const echoDef = registeredTools.find((t) => t.name === "echo-name");
const echo = await echoDef.execute({ name: "alice" }, { signal: new AbortController().signal });
assert.equal(echo.exitCode, 0);
assert.equal(echo.stdout, "alice");
const failDef = registeredTools.find((t) => t.name === "fail-loud");
const failed = await failDef.execute({}, { signal: new AbortController().signal });
assert.equal(failed.exitCode, 3);
assert.ok(failed.stderr.includes("boom"));
const optDef = registeredTools.find((t) => t.name === "optional-param");
const withNumber = await optDef.execute({ count: 7 }, { signal: new AbortController().signal });
assert.equal(withNumber.stdout, "7");
console.log("custom tool execution ok (real subprocess + placeholders)");

// output render: exit-0 shows stdout, exit!=0 shows stderr.
const text0 = echoDef.output.render(
  { name: "alice" },
  { stdout: "alice", stderr: "", exitCode: 0 },
);
assert.ok(text0[0].text.includes("alice"));
const text3 = failDef.output.render({}, { stdout: "", stderr: "boom", exitCode: 3 });
assert.ok(text3[0].text.includes("boom"));
console.log("output render ok");

// CLI round-trip: add/list/remove over a temp home.
const cliHome = join(root, "cli-home");
const cliEnv = { ...process.env, DSH_HOME: cliHome };
const cli = new URL("./bin/tool.mjs", import.meta.url).pathname;
{
  const addRes = spawnSync(
    process.execPath,
    [cli, "add", "lint-py", "Lint a python file", "ruff", "check"],
    { env: cliEnv, encoding: "utf8" },
  );
  assert.equal(addRes.status, 0, addRes.stderr);
  assert.ok(addRes.stdout.includes("added tool lint-py"));
  const listRes = spawnSync(process.execPath, [cli, "list"], { env: cliEnv, encoding: "utf8" });
  assert.equal(listRes.status, 0, listRes.stderr);
  assert.ok(listRes.stdout.includes("lint-py"));
  const text = readFileSync(join(cliHome, "settings.yaml"), "utf8");
  assert.ok(text.includes("agent-tools:"));
  assert.ok(text.includes("ruff"));
  const rmRes = spawnSync(process.execPath, [cli, "remove", "lint-py"], {
    env: cliEnv,
    encoding: "utf8",
  });
  assert.equal(rmRes.status, 0, rmRes.stderr);
  const list2 = spawnSync(process.execPath, [cli, "list"], { env: cliEnv, encoding: "utf8" });
  assert.ok(!list2.stdout.includes("lint-py"));
}
console.log("cli round-trip ok (add/list/remove)");

rmSync(root, { recursive: true, force: true });
console.log("plugin check passed");

// jscpd:ignore-end
