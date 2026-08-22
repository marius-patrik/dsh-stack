import Schema from '@deepseek-ai/schemastery';
export const name = 'pack-core';
export const inject = ['slots', 'webServer'];
export const optional = ['icons'];
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.core = { initialized: true };
}
