import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "gemini-studio";
export const inject = ["providers", "accounts", "dialects"];
export const optional: string[] = [];

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  // Mounts gemini-studio adapter
}
