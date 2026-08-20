/**
 * dsh-actions self-restart: the "Force Reload" hard path. The web server
 * spawns a DETACHED replacement process with the same argv/cwd/env, answers
 * the HTTP request, and only then exits — the caller never dies mid-call.
 *
 * Port handoff without SO_REUSEADDR assumptions: the replacement is spawned
 * through a detached wrapper that polls the port until it is FREE (the old
 * process has exited and released it), and only then spawns the real
 * replacement, which binds when the port is free.
 *
 * The probe/spawn helpers are ported from dsh-desktop's lifecycle.ts so the
 * same wait/probe discipline is exercised here and in check-plugin.
 * @module dsh-actions/reload
 */
import { spawn } from 'node:child_process';
/** Default port the dsh web server listens on (matches dsh-desktop). */
export const DEFAULT_PORT = 3080;
/** Default host the dsh web server listens on (matches dsh-desktop). */
export const DEFAULT_HOST = '127.0.0.1';
/** How long the old process waits after responding before exiting. */
export const EXIT_DELAY_MS = 250;
/** Poll the server until it answers, or the timeout elapses. */
export async function waitForServer(host, port, timeoutMs = 30_000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await probeServer(host, port))
            return true;
        await new Promise((resolve) => setTimeout(resolve, 300));
    }
    return probeServer(host, port);
}
/** One readiness probe: true when the root route answers HTTP 200. */
export async function probeServer(host, port) {
    try {
        const root = await fetch(`http://${host}:${port}/`, { signal: AbortSignal.timeout(2000) });
        if (root.ok)
            return true;
    }
    catch {
        // not up yet
    }
    return false;
}
/** Whether a spawned child is still alive. */
export function isAlive(child) {
    if (child === undefined)
        return false;
    return child.exitCode === null && child.signalCode === null;
}
/**
 * Build the restart plan from the live process: same executable, same
 * arguments, same working directory, same environment.
 * @param argv - process.argv of the running server.
 * @param cwd - process.cwd() of the running server.
 * @param env - process.env of the running server.
 * @param host - the request's local address (fallback DEFAULT_HOST).
 * @param port - the request's local port (fallback DEFAULT_PORT).
 */
export function planSelfRestart(argv, cwd, env, host, port) {
    const command = argv[0];
    if (command === undefined)
        throw new Error('cannot plan a self-restart: process.argv is empty');
    return {
        command,
        args: argv.slice(1),
        cwd,
        env: { ...env },
        host: host ?? DEFAULT_HOST,
        port: port ?? DEFAULT_PORT,
    };
}
/**
 * Whether this process looks like the dsh WEB server (the only profile where
 * a self-restart is meaningful): the argv carries a `web` subcommand or a
 * `--profile web` / `--profile=web` pair. Headless and CLI profiles fail
 * this check, and the reload route refuses them with a clear error.
 */
export function isWebServerProcess(argv) {
    const args = argv.slice(2);
    for (let index = 0; index < args.length; index++) {
        const arg = args[index];
        if (arg === 'web')
            return true;
        if (arg === '--profile' && args[index + 1] === 'web')
            return true;
        if (arg === '--profile=web')
            return true;
    }
    return false;
}
/**
 * The detached port-handoff wrapper, evaluated with `node -e` by
 * {@link spawnReplacement}. Arguments (process.argv from index 1, since -e
 * consumes no script slot): host, port, cwd, command, ...args. Polls until
 * the port refuses a connection (the old server exited and released it),
 * then spawns the real replacement detached and exits itself.
 */
export const HANDOFF_WRAPPER_SOURCE = [
    `const net = require("node:net")`,
    `const cp = require("node:child_process")`,
    `const [host, port, cwd, command, ...args] = process.argv.slice(1)`,
    `function launch() {`,
    `  const child = cp.spawn(command, args, { cwd, env: process.env, detached: true, stdio: "ignore" })`,
    `  child.on("error", () => process.exit(1))`,
    `  child.unref()`,
    `  process.exit(0)`,
    `}`,
    `function waitForPortFree() {`,
    `  const socket = net.connect(Number(port), host)`,
    `  socket.once("connect", () => { socket.end(); setTimeout(waitForPortFree, 200) })`,
    `  socket.once("error", () => launch())`,
    `}`,
    `waitForPortFree()`,
].join("\n");
/**
 * Spawn the detached handoff wrapper for one restart plan. The wrapper
 * outlives this process, waits for the port to free, and launches the
 * replacement; this process only gets the wrapper's pid back.
 * @param plan - the restart plan from {@link planSelfRestart}.
 * @returns the spawned wrapper child (detached, unref'd).
 */
export function spawnReplacement(plan) {
    const wrapper = spawn(plan.command, ['-e', HANDOFF_WRAPPER_SOURCE, plan.host, String(plan.port), plan.cwd, plan.command, ...plan.args], { cwd: plan.cwd, env: plan.env, detached: true, stdio: 'ignore' });
    wrapper.unref();
    return wrapper;
}
/** Read one JSON request body, bounded at 64 KiB. */
async function readBody(req) {
    if (req.on === undefined)
        return undefined;
    const chunks = [];
    let size = 0;
    await new Promise((resolve, reject) => {
        req.on('data', (chunk) => {
            if (chunk === undefined)
                return;
            size += chunk.length;
            if (size > 65_536) {
                reject(new Error('request body too large'));
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve());
        req.on('error', () => reject(new Error('request body read failed')));
    });
    const text = Buffer.concat(chunks).toString('utf8').trim();
    return text === '' ? undefined : JSON.parse(text);
}
function respond(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
}
/**
 * The POST /actions/api/reload handler. Only `{ "mode": "force" }` is
 * accepted (the soft reload is client-side location.reload()). The force
 * path: guard that this is the web server, plan the restart from the live
 * process, spawn the detached handoff wrapper, SEND THE RESPONSE, then
 * schedule the old process's exit so the caller never dies mid-call.
 */
export function createReloadHandler(options = {}) {
    const isWebServer = options.isWebServer ?? (() => isWebServerProcess(process.argv));
    const exitDelayMs = options.exitDelayMs ?? EXIT_DELAY_MS;
    return async function reloadHandler(req, res) {
        if (!isWebServer()) {
            respond(res, 409, {
                ok: false,
                error: 'force reload is only available when running as the dsh web server (this profile is not the web profile)',
            });
            return;
        }
        let body;
        try {
            body = await readBody(req);
        }
        catch (error) {
            respond(res, 400, { ok: false, error: `invalid request body: ${error instanceof Error ? error.message : String(error)}` });
            return;
        }
        const mode = body?.mode;
        if (mode !== 'force') {
            respond(res, 400, {
                ok: false,
                error: 'unsupported reload mode (expected { "mode": "force" }; the soft reload is client-side: location.reload())',
            });
            return;
        }
        const plan = options.plan !== undefined
            ? options.plan()
            : planSelfRestart(process.argv, process.cwd(), process.env, req.socket?.localAddress, req.socket?.localPort);
        const spawnReplacement = options.spawnReplacement ?? ((p) => spawnReplacementOf(p));
        const child = spawnReplacement(plan);
        respond(res, 200, {
            ok: true,
            mode: 'force',
            replacement: { pid: child.pid ?? null, port: plan.port, host: plan.host },
        });
        const exit = options.exit ?? ((code) => process.exit(code));
        const timer = setTimeout(() => exit(0), exitDelayMs);
        timer.unref();
    };
}
/** Indirection so the default spawner stays named despite the option shadow. */
function spawnReplacementOf(plan) {
    return spawnReplacement(plan);
}
