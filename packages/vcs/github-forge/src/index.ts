import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "github-forge";
export const inject = ["github-cli", "repos", "accounts"];
export const optional: string[] = [];

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  // Mounts github-forge adapter
}
