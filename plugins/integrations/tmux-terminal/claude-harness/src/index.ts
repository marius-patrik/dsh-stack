import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "claude-harness";
export const inject = ["tmux"];
export const optional = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Registers claude-harness interactive tmux runner
}
