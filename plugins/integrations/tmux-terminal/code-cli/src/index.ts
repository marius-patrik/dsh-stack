import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "code-cli";
export const inject = ["tmux"];
export const optional = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Registers code-cli interactive tmux runner
}
