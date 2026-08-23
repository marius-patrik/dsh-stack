import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "forgejo-forge";
export const inject = ["repos", "accounts", "tools"];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Mounts forgejo-forge adapter
}
