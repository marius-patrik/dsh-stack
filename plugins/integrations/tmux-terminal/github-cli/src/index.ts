import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'github-cli';
export const inject = ['tmux'];
export const optional = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Registers github-cli interactive tmux runner
}
