#!/usr/bin/env node
/**
 * dsh — homeRoot/command-aware launcher and service manager for the DeepSeek
 * Harness. Canonical TypeScript implementation lives in src/; this bin is the
 * thin `dsh` command entrypoint.
 *
 * Usage:
 *   dsh start        Start the dsh web server in the background
 *   dsh stop         Stop the running dsh web server
 *   dsh restart      Gracefully restart the dsh web server and show health
 *   dsh status       Show process status, URLs (Local + Tailscale), and plugin health
 *   dsh logs [-f] [-n lines]   View or tail the web server logs
 *   dsh accounts|theme|lsp|formatter|agents [args]   Owning package CLIs
 *   dsh [args...]    Fall through to the harness CLI
 */

import { basename } from "node:path";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  findHarnessDir,
  followLog,
  harnessCli,
  migrateHome,
  packageDir,
  readLogTail,
  readTweaks,
  resolveHome,
  resolvePort,
  route,
  startPortHint,
  startServer,
  statusReport,
  stopServer,
  verbBin,
} from "../lib/index.js";

/** The log file the background web server writes to. */
const logFile = join(tmpdir(), "dsh-web.log");

/** Run another CLI in this terminal and propagate its exit code. */
function execBin(bin, prefixArgs, args) {
  const res = spawnSync(process.execPath, [...prefixArgs, bin, ...args], {
    stdio: "inherit",
    env: process.env,
  });
  if (res.error !== undefined) {
    process.stderr.write(`dsh: failed to run ${bin}: ${res.error.message}\n`);
    process.exitCode = 1;
    return;
  }
  process.exitCode = res.status ?? 1;
}

/** Print the status report for the resolved port. */
async function showStatus(home, profile) {
  const port = resolvePort(home, profile, logFile);
  process.stdout.write(`${await statusReport(port, logFile)}\n`);
}

/** Start the server and report the outcome. Returns false on failure. */
async function start(harnessDir, home, profile) {
  if (harnessDir === null) {
    process.stderr.write("dsh: harness checkout not found (set DSH_HOME and DSH_HARNESS)\n");
    return false;
  }
  const started = await startServer({
    harnessDir,
    home,
    logFile,
    portHint: startPortHint(home, profile),
    log: (msg) => process.stdout.write(`${msg}\n`),
  });
  if (started === null) {
    process.stderr.write(`dsh: failed to start web server. Check logs: ${logFile}\n`);
    const tail = readLogTail(logFile, 20);
    if (tail !== null) process.stderr.write(tail);
    return false;
  }
  process.stdout.write(`dsh: web server started successfully (PID: ${started.pid})\n`);
  await showStatus(home, profile);
  return true;
}

/** Execute one routed plan. */
async function execute(plan, ctx) {
  const { home, profile, pkgDir, harnessDir } = ctx;
  if (plan.kind === "lifecycle") {
    if (plan.action === "status") {
      await showStatus(home, profile);
      return;
    }
    if (plan.action === "stop") {
      await stopServer(resolvePort(home, profile, logFile), (msg) =>
        process.stdout.write(`${msg}\n`),
      );
      return;
    }
    if (plan.action === "start") {
      if (!(await start(harnessDir, home, profile))) process.exitCode = 1;
      return;
    }
    process.stdout.write("dsh: restarting web server...\n");
    await stopServer(resolvePort(home, profile, logFile), (msg) =>
      process.stdout.write(`${msg}\n`),
    );
    if (!(await start(harnessDir, home, profile))) process.exitCode = 1;
    return;
  }
  if (plan.kind === "logs") {
    if (plan.follow) {
      followLog(logFile, plan.lines, (text) => process.stdout.write(text));
      return;
    }
    const tail = readLogTail(logFile, plan.lines);
    process.stdout.write(tail ?? `dsh: no log file found at ${logFile}\n`);
    return;
  }
  if (plan.kind === "verb") {
    const bin = verbBin(pkgDir, plan.verb);
    if (bin === null) {
      process.stderr.write(`dsh: no CLI installed for verb "${plan.verb}"\n`);
      process.exitCode = 1;
      return;
    }
    execBin(bin, [], plan.args);
    return;
  }
  if (harnessDir === null) {
    process.stderr.write("dsh: harness checkout not found (set DSH_HARNESS)\n");
    process.exitCode = 1;
    return;
  }
  const cli = harnessCli(harnessDir);
  if (cli === null) {
    process.stderr.write(`dsh: harness CLI not found under ${harnessDir}\n`);
    process.exitCode = 1;
    return;
  }
  execBin(cli.bin, cli.tsx ? ["--import", "tsx/esm"] : [], plan.args);
}

/** Entrypoint: resolve home, apply tweaks, route argv, execute the plan. */
async function main() {
  const pkgDir = packageDir(import.meta.url);
  const env = process.env;
  let home = resolveHome(env);
  const tweaks = readTweaks(join(home, "settings.yaml"));
  home = migrateHome(home, tweaks.homeRoot ?? "", (msg) => process.stderr.write(`${msg}\n`));
  env.DSH_HOME = home;
  const profile =
    env.DSH_PROFILE !== undefined && env.DSH_PROFILE.length > 0 ? env.DSH_PROFILE : "web";
  const plan = route(process.argv.slice(2), {
    invokedName: basename(process.argv[1] ?? "dsh"),
    command: tweaks.command,
  });
  await execute(plan, { home, profile, pkgDir, harnessDir: findHarnessDir(env, pkgDir) });
}

main().catch((err) => {
  process.stderr.write(`dsh: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
