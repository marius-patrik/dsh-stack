import Schema from '@deepseek-ai/schemastery';
export const name = 'git-driver';
export const inject = ["git-cli", "repos", "tools"];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts git-driver adapter
}
