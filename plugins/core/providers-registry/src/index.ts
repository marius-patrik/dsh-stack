import { Service, type Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'providers-registry'
export const inject = ['accounts', 'dialects']
export const optional = ['icons']

export interface ProviderRoute {
  id: string
  name: string
  type: 'subscription' | 'api-key' | 'local' | 'zen'
  models: string[]
  status: 'available' | 'exhausted' | 'disabled'
}

export class ProvidersRegistryService extends Service {
  static inject = ['accounts', 'dialects']
  static optional = ['icons']
  private readonly routes = new Map<string, ProviderRoute>()

  constructor(ctx: Context) {
    super(ctx, 'providers')
  }

  registerRoute(route: ProviderRoute): void {
    if (!route.id.trim()) throw new Error('Provider route id must be non-empty')
    this.routes.set(route.id, { ...route, models: [...route.models] })
  }

  getRoute(id: string): ProviderRoute | undefined {
    return this.routes.get(id)
  }

  listRoutes(): ProviderRoute[] {
    return Array.from(this.routes.values(), (route) => ({ ...route, models: [...route.models] }))
  }
}

export interface QuotaMeter {
  used: number
  limit: number
  remaining: number
}

export class QuotasService extends Service {
  constructor(ctx: Context) {
    super(ctx, 'quotas')
  }

  private readonly meters = new Map<string, QuotaMeter>()

  setQuota(provider: string, used: number, limit: number): void {
    if (!provider.trim()) throw new Error('Quota provider id must be non-empty')
    if (!Number.isFinite(used) || !Number.isFinite(limit) || limit < 0 || used < 0) {
      throw new Error('Quota values must be finite non-negative numbers')
    }
    this.meters.set(provider, { used, limit, remaining: Math.max(0, limit - used) })
  }

  getQuota(provider: string): QuotaMeter | undefined {
    const meter = this.meters.get(provider)
    return meter ? { ...meter } : undefined
  }
}

export const Config = Schema.object({})

export function apply(ctx: Context): void {
  new ProvidersRegistryService(ctx)
  new QuotasService(ctx)
}
