import Schema from '@deepseek-ai/schemastery';
export const name = 'sapling-driver';
export const inject = ["sapling-cli", "repos", "tools"];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts sapling-driver adapter
}
