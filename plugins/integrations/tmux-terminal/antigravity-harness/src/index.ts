import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'antigravity-harness';
export const inject = ['tmux'];
export const optional = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Registers antigravity-harness interactive tmux runner
}
