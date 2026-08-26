/**
 * Shared assertions for package `check-plugin.mjs` smoke scripts.
 *
 * Every canonical package/plugin ships a thin `check-plugin.mjs` that
 * validates its built loader shape before exercising package-specific
 * behavior. The loader-shape checks and client-bundle-load checks are
 * identical across packages (only the expected plugin name/id differs),
 * so they are centralized here instead of hand-copied per package.
 */

import { spawnSync } from "node:child_process";

/**
 * Assert that a loaded harness plugin module has the expected loader shape:
 * a matching `name`, a function `apply`, an array `inject`, and no default
 * export (function plugins must not have one).
 *
 * @param {Record<string, unknown>} plugin - the imported plugin module.
 * @param {string} expectedName - the plugin's expected `name` export.
 */
export function assertLoaderShape(plugin, expectedName) {
  if (plugin.name !== expectedName) throw new Error("bad name");
  if (typeof plugin.apply !== "function") throw new Error("bad apply");
  if (!Array.isArray(plugin.inject)) throw new Error("bad inject");
  if (plugin.default !== undefined) {
    throw new Error("function plugins must not have a default export");
  }
}

/**
 * Load a hand-authored browser client bundle (`client.js`), register a stub
 * `__ModuleLoader__.load` on `globalThis.window`, import the bundle, and
 * return the registered loader spec so callers can assert its id/inject and
 * invoke its `factory`.
 *
 * @param {string | URL} clientUrl - URL of the client.js bundle to import.
 * @returns {Promise<{ spec: any }>} the object the bundle registered.
 */
export async function loadClientLoaderSpec(clientUrl) {
  const loader = {};
  globalThis.window = {
    __ModuleLoader__: {
      load: (spec) => {
        loader.spec = spec;
      },
    },
  };
  await import(clientUrl);
  return loader;
}

/**
 * Create a stub `settings` service for boot-style checks: records registered
 * namespaces and answers `get`/`watch` from the install-time base value.
 *
 * @returns {{ service: object, registrations: unknown[] }} the stub service
 *   and the list of namespaces registered through it.
 */
export function stubSettingsService() {
  const registrations = [];
  const service = {
    /** register implementation. */
    register(ns, _schema, opts) {
      registrations.push(ns);
      return { get: () => opts.base, watch: () => undefined };
    },
  };
  return { service, registrations };
}

/**
 * Build a stub `ctx.subprocess` that runs real child processes through
 * `spawnSync` and adapts the result to the harness subprocess collector
 * shape (`collected.stdout/stderr.readFrom()`), for check-plugin.mjs scripts
 * that exercise real subprocess-backed tools (git, shell, etc).
 *
 * @param {NodeJS.ProcessEnv} [env] - environment passed to the spawned process.
 * @returns {{ spawn(spec: { argv: string[]; cwd?: string }): object }}
 */
export function stubSpawnSyncSubprocess(env) {
  return {
    spawn: (spec) => {
      const res = spawnSync(spec.argv[0], spec.argv.slice(1), {
        cwd: spec.cwd,
        encoding: "utf8",
        ...(env !== undefined ? { env } : {}),
      });
      return {
        pid: res.pid ?? -1,
        done: Promise.resolve({ exitCode: res.status, signal: null }),
        collected: {
          stdout: { readFrom: () => ({ text: res.stdout ?? "", nextOffset: 0, lossy: false }) },
          stderr: { readFrom: () => ({ text: res.stderr ?? "", nextOffset: 0, lossy: false }) },
        },
        terminate: () => {},
        waitForExit: async () => true,
      };
    },
  };
}
