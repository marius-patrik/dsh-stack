import Schema from '@deepseek-ai/schemastery';
export const name = 'forgejo-forge';
export const inject = ["repos", "accounts", "tools"];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts forgejo-forge adapter
}
