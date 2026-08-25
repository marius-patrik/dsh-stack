import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "kimi-harness";
export const inject = ["tmux"];
export const optional = [];

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  // Registers kimi-harness interactive tmux runner
}
