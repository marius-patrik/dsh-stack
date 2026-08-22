import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'pack-integrations';
export const inject = ['slots', 'webServer'];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).integrationsPack = { initialized: true };
}
