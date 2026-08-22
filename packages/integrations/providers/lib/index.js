import Schema from '@deepseek-ai/schemastery';
export const name = 'pack-direct-providers';
export const inject = ['providers', 'accounts', 'dialects'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Direct API providers umbrella
}
