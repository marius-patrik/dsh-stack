#!/usr/bin/env node
/**
 * `dsh sessions` — lists session ids + cached stats for the current
 * workspace. Thin wrapper over the same projection-cache reader as
 * `dsh stats`; defaults to JSON so scripts can consume it.
 *
 * Usage: dsh sessions [--cwd <path>]
 */

import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { resolveHome } from "../lib/home.js";
import { listAllSessions, formatJson } from "../lib/stats.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
void __dirname;

const args = process.argv.slice(2);
const cwdIndex = args.indexOf("--cwd");
const cwd = cwdIndex >= 0 ? args[cwdIndex + 1] : undefined;

const home = await resolveHome();
const rows = await listAllSessions(home, cwd);
console.log(formatJson(rows));
