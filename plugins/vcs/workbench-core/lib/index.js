import Schema from '@deepseek-ai/schemastery';
export const name = 'workbench-core';
export const inject = ['tools', 'webServer'];
export const optional = ['icons'];
export class ReposWorkbenchService {
    repos = new Map();
    registerRepo(details) {
        this.repos.set(details.path, details);
    }
    getRepo(path) {
        return this.repos.get(path);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.repos = new ReposWorkbenchService();
}
