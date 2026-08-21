import Schema from '@deepseek-ai/schemastery';
export const name = 'integrations-registry';
export const inject = ['webServer', 'slots'];
export const optional = ['icons'];
export class IntegrationsRegistryService {
    registry = new Map();
    register(entry) {
        this.registry.set(entry.id, entry);
    }
    get(id) {
        return this.registry.get(id);
    }
    all() {
        return Array.from(this.registry.values());
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.integrations = new IntegrationsRegistryService();
}
