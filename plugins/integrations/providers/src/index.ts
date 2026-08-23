import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "pack-direct-providers";
export const inject = ["providers", "accounts", "dialects"];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Direct API providers umbrella
}
