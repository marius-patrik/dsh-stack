import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'terminal-client';
export const inject: string[] = [];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Standalone TUI client entry point
}
