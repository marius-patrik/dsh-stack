import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'providers-registry';
export const inject = ['accounts', 'dialects'];
export const optional = ['icons'];

export interface ProviderRoute {
  id: string;
  name: string;
  type: 'subscription' | 'api-key' | 'local' | 'zen';
  models: string[];
  status: 'available' | 'exhausted' | 'disabled';
}

export class ProvidersRegistryService {
  private routes = new Map<string, ProviderRoute>();

  registerRoute(route: ProviderRoute): void {
    this.routes.set(route.id, route);
  }

  getRoute(id: string): ProviderRoute | undefined {
    return this.routes.get(id);
  }

  listRoutes(): ProviderRoute[] {
    return Array.from(this.routes.values());
  }
}

export class QuotasService {
  private meters = new Map<string, { used: number; limit: number; remaining: number }>();

  setQuota(provider: string, used: number, limit: number): void {
    this.meters.set(provider, { used, limit, remaining: Math.max(0, limit - used) });
  }

  getQuota(provider: string) {
    return this.meters.get(provider);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).providers = new ProvidersRegistryService();
  (ctx as any).quotas = new QuotasService();
}
