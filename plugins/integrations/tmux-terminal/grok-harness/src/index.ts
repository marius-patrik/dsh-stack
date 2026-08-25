import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "grok-harness";
export const inject = ["tmux"];
export const optional = [];

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  // Registers grok-harness interactive tmux runner
}
