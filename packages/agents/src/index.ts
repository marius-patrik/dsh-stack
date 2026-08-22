import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'pack-agents';
export const inject = ['slots', 'webServer'];
export const optional = ['llm'];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).agentsPack = { initialized: true };
}
