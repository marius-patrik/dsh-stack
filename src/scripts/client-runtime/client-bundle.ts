/**
 * Shared tsdown config for stack packages' browser client bundles. Mirrors
 * harness/packages/client/tsdown.client.ts: wraps the bundle in
 * `window.__ModuleLoader__.load({ id, factory })` so the web shell can mount
 * it through the loader module table instead of a bare ESM/CJS import.
 * @module @dsh-stack/scripts/client-runtime/client-bundle
 */
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
    noExternal: (specifier: string) => specifier.startsWith("@dsh-stack/"),
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
