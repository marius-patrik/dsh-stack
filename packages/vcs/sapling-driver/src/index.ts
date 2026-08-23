import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "sapling-driver";
export const inject = ["sapling-cli", "repos", "tools"];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Mounts sapling-driver adapter
}
