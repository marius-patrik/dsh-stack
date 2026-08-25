import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "npm-cli";
export const inject = ["tmux"];
export const optional = [];

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  // Registers npm-cli interactive tmux runner
}
