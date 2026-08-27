/**
 * Second build output for this package: a browser IIFE that publishes the tab
 * runtime as `globalThis.__dshWorkspaceTabs`. The client bundle that hosts the
 * surfaces (`@dsh-stack/providers`) is a hand-authored classic script assembled
 * by concatenation, so it consumes this global instead of an ESM import -- the
 * same mechanism `src/scripts/client-runtime/glyph-factory.js` already uses.
 * There is still one implementation: both outputs are built from `src/`.
 */
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { browser: "src/index.ts" },
  outDir: "lib",
  format: ["iife"],
  platform: "browser",
  target: "es2024",
  dts: false,
  clean: false,
  sourcemap: false,
  globalName: "__dshWorkspaceTabs",
  outputOptions: { entryFileNames: "browser.js" },
});
