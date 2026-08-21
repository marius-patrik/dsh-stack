import Schema from '@deepseek-ai/schemastery';
export const name = 'pack-integrations';
export const inject = ['slots', 'webServer'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.integrationsPack = { initialized: true };
}
