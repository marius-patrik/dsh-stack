/**
 * dialect-gemini: the Google Gemini wire dialect extension. Registers itself
 * into the `@dsh-stack/dialects` registry — the dialect abstraction every
 * wire-format extension plugs into. `@dsh-stack/dialect-code-assist` depends
 * on this package's serialization helpers (the Code Assist wire is a JSON
 * wrapper over the same Gemini vocabulary).
 *
 * @module dialect-gemini
 */

import { Context } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import "@dsh-stack/dialects";
import { geminiDialect } from "./gemini.js";

export { geminiDialect, serializeContents, buildToolNameIndex } from "./gemini.js";
export type { WireContent } from "./gemini.js";
export { translateGemini, mapGeminiFinishReason } from "./translate-gemini.js";

// jscpd:ignore-start -- structural: every dialect extension registers into the shared dialects registry with the same name/inject/Config/apply pattern, following the pattern already used repo-wide for one-extension-per-feature registrations (dsh-stack#135)
export const name = "dialect-gemini";
export const inject = ["dialects"];

/** dialect-gemini configuration; empty — the dialect is built in. */
export interface Config {}

/** Schemastery configuration for the plugin. */
export const Config: z<Config> = z.object({});

/** apply implementation. */
export function apply(ctx: Context, _config: Config): void {
  ctx.effect(() => {
    ctx.dialects.register(geminiDialect);
    return () => ctx.dialects.unregister(geminiDialect.id);
  });
}
// jscpd:ignore-end
