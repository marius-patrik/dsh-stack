import Schema from '@deepseek-ai/schemastery';
export const name = 'pack-ai';
export const inject = [];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.aiPack = { initialized: true };
}
