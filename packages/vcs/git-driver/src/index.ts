import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'git-driver';
export const inject = ["git-cli","repos","tools"];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Mounts git-driver adapter
}
