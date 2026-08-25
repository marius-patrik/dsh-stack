/**
 * dialects: provider wire dialects as a harness plugin. Registers the
 * `ctx.dialects` service and the bundled `openai`, `claude`, `gemini`, and
 * `code-assist` dialects; LLM adapter plugins (e.g. providers) resolve a
 * dialect by id to serialize requests and translate response streams.
 *
 * @module dialects
 */

import { Context, Service } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import { claudeDialect } from "./claude.js";
import { codeAssistDialect } from "./code-assist.js";
import { antigravityDialect } from "./antigravity.js";
export { antigravityDialect, ANTIGRAVITY_PROJECT_HEADER } from "./antigravity.js";
import { geminiDialect } from "./gemini.js";
import { openaiDialect } from "./openai.js";
import type { Dialect, DialectId } from "./types.js";

export type { Dialect, DialectAuth, DialectDefaults, DialectId, WireRequest } from "./types.js";
export { parseSseData, parseSseEvents } from "./sse.js";
export { parseNdjson } from "./ndjson.js";
export {
  translateOpenAi,
  mapFinishReason as mapOpenAiFinishReason,
  mapUsage as mapOpenAiUsage,
} from "./translate-openai.js";
export { translateClaude, mapClaudeFinishReason, mapClaudeUsage } from "./translate-claude.js";
export { translateGemini, mapGeminiFinishReason } from "./translate-gemini.js";
export { serializeMessages as serializeOpenAiMessages } from "./openai.js";
export {
  serializeContents as serializeGeminiContents,
  buildToolNameIndex as buildGeminiToolNameIndex,
} from "./gemini.js";

/**
 * The `dialects` service: a typed registry of provider wire dialects.
 * Registered automatically with the owning plugin fiber; dialect contributions
 * are HMR-safe through `ctx.effect` disposers.
 */
export class DialectRegistry extends Service {
  private readonly dialects = new Map<DialectId, Dialect>();

  /** Constructs an instance. */
  constructor(ctx: Context) {
    super(ctx, "dialects");
  }

  /**
   * Register one dialect under its id. Throws on duplicate ids.
   * @param dialect - the dialect to register.
   */
  register(dialect: Dialect): void {
    if (this.dialects.has(dialect.id)) {
      throw new Error(`dialects: duplicate dialect "${dialect.id}"`);
    }
    this.dialects.set(dialect.id, dialect);
  }

  /**
   * Withdraw a dialect registration.
   * @param id - the dialect id to remove.
   */
  unregister(id: DialectId): void {
    this.dialects.delete(id);
  }

  /**
   * Resolve a dialect by id.
   * @param id - the dialect id.
   * @returns the dialect; throws when unknown.
   */
  get(id: DialectId): Dialect {
    const dialect = this.dialects.get(id);
    if (dialect === undefined) {
      throw new Error(`dialects: unknown dialect "${id}"`);
    }
    return dialect;
  }

  /** Every registered dialect, in registration order. */
  list(): readonly Dialect[] {
    return [...this.dialects.values()];
  }
}

declare module "@deepseek-ai/cordis" {
  interface Context {
    dialects: DialectRegistry;
  }
}

export const name = "dialects";
export const inject: never[] = [];

/** dialects configuration; empty — the bundled dialects are built in. */
export interface Config {}

/** Schemastery configuration for the plugin. */
export const Config: z<Config> = z.object({});

/** apply implementation. */
export function apply(ctx: Context, _config: Config): void {
  new DialectRegistry(ctx);
  for (const dialect of [
    openaiDialect,
    claudeDialect,
    geminiDialect,
    codeAssistDialect,
    antigravityDialect,
  ]) {
    ctx.effect(() => {
      ctx.dialects.register(dialect);
      return () => ctx.dialects.unregister(dialect.id);
    });
  }
}
