import Schema from '@deepseek-ai/schemastery';
export const name = 'pack-vcs';
export const inject = ['slots', 'webServer'];
export const optional = ['icons'];
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.vcsPack = { initialized: true };
}
