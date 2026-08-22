import Schema from '@deepseek-ai/schemastery';
export const name = 'deepseek-official';
export const inject = ['providers', 'accounts', 'dialects'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts deepseek-official adapter
}
