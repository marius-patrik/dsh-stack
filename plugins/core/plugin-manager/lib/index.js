import Schema from '@deepseek-ai/schemastery';
export const name = 'plugin-manager';
export const inject = ['webServer', 'slots'];
export const optional = [];
export class PluginManagerService {
    ctx;
    plugins = new Map();
    constructor(ctx) {
        this.ctx = ctx;
    }
    register(manifest) {
        this.plugins.set(manifest.name, manifest);
    }
    get(name) {
        return this.plugins.get(name);
    }
    all() {
        return Array.from(this.plugins.values());
    }
    resolveDAG() {
        return Array.from(this.plugins.keys());
    }
}
export const Config = Schema.object({
    autoReload: Schema.boolean().default(true),
});
export function apply(ctx, config) {
    const service = new PluginManagerService(ctx);
    ctx.plugins = service;
}
