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
 * Verify one `@dsh-stack/provider-<id>` extension: boots a `Context` with
 * `dialects` and the `providers` registry applied, applies the extension, and
 * asserts it registered exactly its own route under its own id with the
 * expected loader shape. Centralized here because every provider extension's
 * `verify.mjs` would otherwise be an identical copy differing only in the id
 * string.
 *
 * @param {string} id - the provider route id this extension registers (e.g. `"kimi-code"`).
 * @param {Record<string, unknown>} extension - the imported extension module.
 * @param {{ Context: unknown, dialects: Record<string, unknown>, providers: Record<string, unknown> }} deps -
 *   `@deepseek-ai/cordis`'s `Context`, and the `@dsh-stack/dialects` and
 *   `@dsh-stack/providers` modules, imported by the caller (not here) so they
 *   resolve against the calling extension's own dependencies rather than this
 *   shared script's.
 */
export async function assertProviderExtension(id, extension, deps) {
  const { Context, dialects, providers } = deps;

  assertLoaderShape(extension, `provider-${id}`);
  if (!Array.isArray(extension.inject) || extension.inject[0] !== "providers") {
    throw new Error(`provider-${id}: expected inject to include "providers"`);
  }

  const ctx = new Context();
  dialects.apply(ctx, {});
  new providers.ProviderRegistry(ctx);
  extension.apply(ctx);

  if (!ctx.providers.has(id)) throw new Error(`provider-${id}: route was not registered`);
  const route = ctx.providers.get(id);
  if (route.id !== id) throw new Error(`provider-${id}: route.id mismatch`);
  if (typeof route.displayName !== "string" || route.displayName.length === 0) {
    throw new Error(`provider-${id}: route.displayName must be a non-empty string`);
  }
  if (!Array.isArray(route.models))
    throw new Error(`provider-${id}: route.models must be an array`);
  console.log(`provider-${id} verification passed:`, route.displayName);
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
    /**
     * Registers a namespace with an optional base value.
     * Returns an object with methods `get` to retrieve the base value and `watch` to subscribe to changes (which always returns undefined).
     * @param {string} ns - The namespace to register.
     * @param {_schema} _schema - The schema associated with the namespace.
     * @param {Object} opts - Registration options including `base`.
     */
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
