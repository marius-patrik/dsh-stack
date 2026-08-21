import Schema from '@deepseek-ai/schemastery';
export const name = 'package-managers';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional = [];
export class PackageManagersService {
    detect(projectPath) {
        return [{ type: 'pnpm', lockfile: 'pnpm-lock.yaml' }];
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.packageManagers = new PackageManagersService();
}
