import Schema from '@deepseek-ai/schemastery';
export const name = 'gemini-studio';
export const inject = ['providers', 'accounts', 'dialects'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts gemini-studio adapter
}
