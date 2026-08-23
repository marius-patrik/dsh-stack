import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'integrations-registry';
export const inject = ['webServer', 'slots'];
export const optional = ['icons'];

export interface IntegrationEntry {
  id: string;
  name: string;
  category: 'sandbox' | 'editor' | 'tool' | 'vcs' | 'runtime' | 'network';
  installed: boolean;
  status: 'online' | 'standby' | 'error';
  version?: string;
}

export class IntegrationsRegistryService {
  private registry = new Map<string, IntegrationEntry>();

  register(entry: IntegrationEntry): void {
    this.registry.set(entry.id, entry);
  }

  get(id: string): IntegrationEntry | undefined {
    return this.registry.get(id);
  }

  all(): IntegrationEntry[] {
    return Array.from(this.registry.values());
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).integrations = new IntegrationsRegistryService();
}
