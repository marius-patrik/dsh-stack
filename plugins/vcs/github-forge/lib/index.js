import Schema from '@deepseek-ai/schemastery';
export const name = 'github-forge';
export const inject = ["github-cli", "repos", "accounts"];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts github-forge adapter
}
