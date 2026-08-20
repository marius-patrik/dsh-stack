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
import { type ChildProcess } from 'node:child_process';
/** Default port the dsh web server listens on (matches dsh-desktop). */
export declare const DEFAULT_PORT = 3080;
/** Default host the dsh web server listens on (matches dsh-desktop). */
export declare const DEFAULT_HOST = "127.0.0.1";
/** How long the old process waits after responding before exiting. */
export declare const EXIT_DELAY_MS = 250;
/** Poll the server until it answers, or the timeout elapses. */
export declare function waitForServer(host: string, port: number, timeoutMs?: number): Promise<boolean>;
/** One readiness probe: true when the root route answers HTTP 200. */
export declare function probeServer(host: string, port: number): Promise<boolean>;
/** Whether a spawned child is still alive. */
export declare function isAlive(child: ChildProcess | undefined): boolean;
/** Everything a self-restart needs to re-spawn this exact server. */
export interface RestartPlan {
    /** The executable (process.argv[0]). */
    command: string;
    /** The arguments (process.argv.slice(1)). */
    args: readonly string[];
    /** The working directory (process.cwd()). */
    cwd: string;
    /** The environment the replacement inherits. */
    env: NodeJS.ProcessEnv;
    /** The host the server listens on. */
    host: string;
    /** The port the server listens on. */
    port: number;
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
export declare function planSelfRestart(argv: readonly string[], cwd: string, env: NodeJS.ProcessEnv, host: string | undefined, port: number | undefined): RestartPlan;
/**
 * Whether this process looks like the dsh WEB server (the only profile where
 * a self-restart is meaningful): the argv carries a `web` subcommand or a
 * `--profile web` / `--profile=web` pair. Headless and CLI profiles fail
 * this check, and the reload route refuses them with a clear error.
 */
export declare function isWebServerProcess(argv: readonly string[]): boolean;
/**
 * The detached port-handoff wrapper, evaluated with `node -e` by
 * {@link spawnReplacement}. Arguments (process.argv from index 1, since -e
 * consumes no script slot): host, port, cwd, command, ...args. Polls until
 * the port refuses a connection (the old server exited and released it),
 * then spawns the real replacement detached and exits itself.
 */
export declare const HANDOFF_WRAPPER_SOURCE: string;
/**
 * Spawn the detached handoff wrapper for one restart plan. The wrapper
 * outlives this process, waits for the port to free, and launches the
 * replacement; this process only gets the wrapper's pid back.
 * @param plan - the restart plan from {@link planSelfRestart}.
 * @returns the spawned wrapper child (detached, unref'd).
 */
export declare function spawnReplacement(plan: RestartPlan): ChildProcess;
/** The request face the reload handler reads (body + local socket). */
export interface ReloadRequest {
    url?: string;
    socket?: {
        localAddress?: string;
        localPort?: number;
    };
    on?(event: 'data' | 'end' | 'error', listener: (chunk?: Buffer) => void): unknown;
}
/** The response face the reload handler writes. */
export interface ReloadResponse {
    writeHead(status: number, headers?: Record<string, string>): void;
    end(body?: string): void;
}
/** Injectable seams for {@link createReloadHandler} (tests drive dummies). */
export interface ReloadHandlerOptions {
    /** Whether this process is the web server; defaults to argv detection. */
    isWebServer?: () => boolean;
    /** The restart plan; defaults to the live process's plan per request. */
    plan?: () => RestartPlan;
    /** The replacement spawner; defaults to the detached handoff wrapper. */
    spawnReplacement?: (plan: RestartPlan) => {
        pid?: number;
    };
    /** The exit hook; defaults to process.exit, scheduled after the response. */
    exit?: (code: number) => void;
    /** How long after the response the old process exits. */
    exitDelayMs?: number;
}
/**
 * The POST /actions/api/reload handler. Only `{ "mode": "force" }` is
 * accepted (the soft reload is client-side location.reload()). The force
 * path: guard that this is the web server, plan the restart from the live
 * process, spawn the detached handoff wrapper, SEND THE RESPONSE, then
 * schedule the old process's exit so the caller never dies mid-call.
 */
export declare function createReloadHandler(options?: ReloadHandlerOptions): (req: ReloadRequest, res: ReloadResponse) => Promise<void>;
