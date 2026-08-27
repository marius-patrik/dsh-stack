// jscpd:ignore-start -- per-package check-plugin.mjs scaffolding, duplicated by design across sibling packages
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert";

const {
  readTweaks,
  resolveHome,
  migrateHome,
  parseBoundPort,
  readProfilePort,
  resolvePort,
  startPortHint,
  route,
  parseLogsArgs,
  readLogTail,
} = await import("./lib/index.js");

const root = mkdtempSync(join(tmpdir(), "launcher-"));

// readTweaks: section parsing, quote stripping, boundaries, missing file.
const homeA = join(root, "home-a");
mkdirSync(homeA, { recursive: true });
writeFileSync(
  join(homeA, "settings.yaml"),
  [
    "ui-theme:",
    "  preference: dark",
    "dsh-tweaks:",
    `  homeRoot: "${join(root, "home-b")}"`,
    "  command: 'status --json'",
    "permission:",
    "  defaultPreset: danger-full-access",
    "",
  ].join("\n"),
);
const tweaks = readTweaks(join(homeA, "settings.yaml"));
assert.equal(tweaks.homeRoot, join(root, "home-b"));
assert.equal(tweaks.command, "status --json");
assert.deepEqual(readTweaks(join(root, "missing.yaml")), {});
const homePlain = join(root, "home-plain");
mkdirSync(homePlain, { recursive: true });
writeFileSync(join(homePlain, "settings.yaml"), "dsh-tweaks:\n  other: value\n");
assert.deepEqual(readTweaks(join(homePlain, "settings.yaml")), {});
console.log("readTweaks ok");

// resolveHome: DSH_HOME wins, else ~/.agents default.
assert.equal(resolveHome({ DSH_HOME: "/tmp/custom-home" }), "/tmp/custom-home");
assert.ok(resolveHome({}).endsWith(join(".agents")));
console.log("resolveHome ok");

// migrateHome: non-destructive copy of dirs and files, effective home swap.
mkdirSync(join(homeA, "profiles", "web"), { recursive: true });
writeFileSync(join(homeA, "profiles", "web", "cordis.patch.yml"), "- id: webserver\n");
mkdirSync(join(homeA, "sessions"), { recursive: true });
writeFileSync(join(homeA, "accounts.vault"), "vault-bytes");
const homeB = join(root, "home-b");
mkdirSync(join(homeB, "sessions"), { recursive: true });
writeFileSync(join(homeB, "sessions", "keep.txt"), "dest-wins");
writeFileSync(join(homeA, "sessions", "keep.txt"), "source-loses");
const notices = [];
const effective = migrateHome(homeA, homeB, (msg) => notices.push(msg));
assert.equal(effective, homeB);
assert.equal(notices.length, 1);
assert.ok(notices[0].includes("dsh-tweaks.homeRoot moved state"));
assert.equal(
  readLogTail(join(homeB, "profiles", "web", "cordis.patch.yml"), 5),
  "- id: webserver\n",
);
assert.equal(readLogTail(join(homeB, "accounts.vault"), 5), "vault-bytes\n");
assert.equal(readLogTail(join(homeB, "sessions", "keep.txt"), 5), "dest-wins\n");
// Same root or empty homeRoot: no move.
assert.equal(
  migrateHome(homeA, homeA, () => {}),
  homeA,
);
assert.equal(
  migrateHome(homeA, "", () => {}),
  homeA,
);
console.log("migrateHome ok");

// parseBoundPort: last dsh-web line wins, junk tolerated.
assert.equal(parseBoundPort("boot\ndsh web: http://127.0.0.1:3081\nready"), 3081);
assert.equal(
  parseBoundPort("dsh web: http://127.0.0.1:3080\ndsh web: http://0.0.0.0:3081\n"),
  3081,
);
assert.equal(parseBoundPort("nothing bound yet"), null);
assert.equal(parseBoundPort("dsh web: http://127.0.0.1:99999"), null);
console.log("parseBoundPort ok");

// readProfilePort: webserver entry of the profile patch.
mkdirSync(join(homeB, "profiles", "web"), { recursive: true });
writeFileSync(
  join(homeB, "profiles", "web", "cordis.patch.yml"),
  [
    "- id: ui-sidebar",
    "  disabled: true",
    "- id: webserver",
    "  config:",
    "    host: '127.0.0.1'",
    "    port: 3081",
    "- id: hosts",
    "  config:",
    "    gatewayPort: 3080",
    "",
  ].join("\n"),
);
assert.equal(readProfilePort(homeB, "web"), 3081);
assert.equal(readProfilePort(homeB, "headless"), null);
mkdirSync(join(homeB, "profiles", "bare"), { recursive: true });
writeFileSync(
  join(homeB, "profiles", "bare", "cordis.patch.yml"),
  "- id: ui-sidebar\n  disabled: true\n",
);
assert.equal(readProfilePort(homeB, "bare"), null);
console.log("readProfilePort ok");

// resolvePort precedence: profile patch > last bound log line > default.
const logFile = join(root, "dsh-web.log");
writeFileSync(logFile, "dsh web: http://127.0.0.1:3080\n");
assert.equal(resolvePort(homeB, "web", logFile), 3081);
assert.equal(resolvePort(homeB, "bare", logFile), 3080);
rmSync(logFile);
assert.equal(resolvePort(homeB, "bare", logFile), 3080);
assert.equal(startPortHint(homeB, "web"), 3081);
assert.equal(startPortHint(homeB, "headless"), 3080);
console.log("resolvePort/startPortHint ok");

// route: lifecycle, logs, package verbs, passthrough, dsh-restart alias,
// dsh-tweaks.command default.
assert.deepEqual(route(["restart"], { invokedName: "dsh" }), {
  kind: "lifecycle",
  action: "restart",
});
assert.deepEqual(route([], { invokedName: "dsh-restart" }), {
  kind: "lifecycle",
  action: "restart",
});
assert.deepEqual(route(["logs", "-f"], { invokedName: "dsh" }), {
  kind: "logs",
  follow: true,
  lines: 50,
});
assert.deepEqual(route(["log", "-n", "10"], { invokedName: "dsh" }), {
  kind: "logs",
  follow: false,
  lines: 10,
});
assert.deepEqual(route(["accounts", "list"], { invokedName: "dsh" }), {
  kind: "verb",
  verb: "accounts",
  args: ["list"],
});
assert.deepEqual(route(["plugin", "list"], { invokedName: "dsh" }), {
  kind: "passthrough",
  args: ["plugin", "list"],
});
assert.deepEqual(route([], { invokedName: "dsh", command: "status --json" }), {
  kind: "lifecycle",
  action: "status",
});
assert.deepEqual(route([], { invokedName: "dsh", command: "plugin list" }), {
  kind: "passthrough",
  args: ["plugin", "list"],
});
console.log("route ok");

// parseLogsArgs and readLogTail edge cases.
assert.deepEqual(parseLogsArgs([]), { follow: false, lines: 50 });
assert.deepEqual(parseLogsArgs(["--follow", "-n", "5"]), { follow: true, lines: 5 });
writeFileSync(logFile, "l1\nl2\nl3\n");
assert.equal(readLogTail(logFile, 2), "l2\nl3\n");
assert.equal(readLogTail(logFile, 50), "l1\nl2\nl3\n");
assert.equal(readLogTail(join(root, "nope.log"), 50), null);
console.log("logs helpers ok");

rmSync(root, { recursive: true, force: true });
console.log("plugin check passed");

// jscpd:ignore-end
