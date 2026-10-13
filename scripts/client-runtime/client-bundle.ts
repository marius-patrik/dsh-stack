/**
 * Shared tsdown config for stack packages' browser client bundles. Mirrors
 * DSH/packages/client/tsdown.client.ts: wraps the bundle in
 * `window.__ModuleLoader__.load({ id, factory })` so the web shell can mount
 * it through the loader module table instead of a bare ESM/CJS import.
 * @module @dsh-stack/scripts/client-runtime/client-bundle
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { UserConfig } from "tsdown";

/**
 * Platform module specifiers the harness loader answers at runtime: framework
 * globals plus every harness-owned `@deepseek-ai/dsh-client-*` UI layer these
 * packages import. Anything not in this list gets bundled in instead.
 */
const CLIENT_EXTERNALS = [
  "react",
  "react/jsx-runtime",
  "react-dom",
  "react-dom/client",
  "@deepseek-ai/cordis",
] as const;

const PACKAGES_ROOT = fileURLToPath(new URL("../../composition/", import.meta.url));

/**
 * `@dsh-stack/*` package names that themselves declare `dsh.client`. Each one
 * is already a governed, individually loaded plugin bundle with its own
 * `apply()`; inlining it a second time into a consuming bundle would run that
 * `apply()` -- and any module-scope state it owns -- once per inlining site
 * instead of once for the page (see #108).
 */
function stackClientPluginPackages(): ReadonlySet<string> {
  const names = new Set<string>();
  /** Discover nested client modules; profile manifests and bundle shells are not clients. */
  function visit(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || ["node_modules", "lib", "dist", ".git", "dsh-tui"].includes(entry.name)) continue;
      const child = join(dir, entry.name);
      try {
        const pkg: { name?: string; dsh?: { client?: unknown } } = JSON.parse(readFileSync(join(child, "package.json"), "utf8"));
        if (pkg.name && pkg.dsh?.client) names.add(pkg.name);
      } catch {
        // Intermediate composition directories have no package.json.
      }
      visit(child);
    }
  }
  visit(PACKAGES_ROOT);
  return names;
}

const STACK_CLIENT_PLUGIN_PACKAGES = stackClientPluginPackages();

/** Whether `specifier` names a `dsh.client`-declaring package itself, or one of its subpaths (e.g. `./client`). */
function isStackClientPluginSpecifier(specifier: string): boolean {
  for (const name of STACK_CLIENT_PLUGIN_PACKAGES)
    if (specifier === name || specifier.startsWith(`${name}/`)) return true;
  return false;
}

/**
 * Build the tsdown config for one stack package's browser client bundle.
 * @param id - full package name (`@dsh-stack/<name>`), stamped into the
 * `__ModuleLoader__.load` handoff.
 * @param entry - client entry file, relative to the package root.
 * @returns tsdown `UserConfig` producing `lib/client.js`.
 */
export function clientBundle(id: string, entry = "src/client/index.ts"): UserConfig {
  return {
    entry: { client: entry },
    outDir: "lib",
    format: ["cjs"],
    platform: "browser",
    target: "es2024",
    dts: false,
    clean: false,
    sourcemap: true,
    external: [...CLIENT_EXTERNALS, /^@deepseek-ai\/dsh-client-/],
    noExternal: (specifier: string) =>
      specifier.startsWith("@dsh-stack/") && !isStackClientPluginSpecifier(specifier),
    define: {
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production"),
      "import.meta.env.MODE": JSON.stringify(process.env.NODE_ENV ?? "production"),
      "import.meta.env": JSON.stringify({ MODE: process.env.NODE_ENV ?? "production" }),
    },
    outputOptions: {
      entryFileNames: "client.js",
      banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
      intro: "var module = { exports: {} }; var exports = module.exports;",
      footer: "return module.exports; } });",
    },
  };
}
