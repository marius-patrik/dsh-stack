import Schema from '@deepseek-ai/schemastery';
export const name = 'openai-api';
export const inject = ['providers', 'accounts', 'dialects'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts openai-api adapter
}
