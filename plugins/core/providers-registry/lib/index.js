import Schema from '@deepseek-ai/schemastery';
export const name = 'providers-registry';
export const inject = ['accounts', 'dialects'];
export const optional = ['icons'];
export class ProvidersRegistryService {
    routes = new Map();
    registerRoute(route) {
        this.routes.set(route.id, route);
    }
    getRoute(id) {
        return this.routes.get(id);
    }
    listRoutes() {
        return Array.from(this.routes.values());
    }
}
export class QuotasService {
    meters = new Map();
    setQuota(provider, used, limit) {
        this.meters.set(provider, { used, limit, remaining: Math.max(0, limit - used) });
    }
    getQuota(provider) {
        return this.meters.get(provider);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.providers = new ProvidersRegistryService();
    ctx.quotas = new QuotasService();
}
