import Schema from '@deepseek-ai/schemastery';
export const name = 'gitlab-forge';
export const inject = ["repos", "accounts", "tools"];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts gitlab-forge adapter
}
