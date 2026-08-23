import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "zen-gateway";
export const inject = ["providers", "accounts", "dialects"];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Mounts zen-gateway adapter
}
