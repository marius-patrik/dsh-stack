import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'plugin-manager';
export const inject = ['webServer', 'slots'];
export const optional: string[] = [];

export interface PluginManifest {
  name: string;
  version: string;
  inject: string[];
  optional: string[];
  status: 'active' | 'inactive' | 'error';
  pack?: string;
}

export class PluginManagerService {
  private plugins = new Map<string, PluginManifest>();

  constructor(private ctx: Context) {}

  register(manifest: PluginManifest): void {
    this.plugins.set(manifest.name, manifest);
  }

  get(name: string): PluginManifest | undefined {
    return this.plugins.get(name);
  }

  all(): PluginManifest[] {
    return Array.from(this.plugins.values());
  }

  resolveDAG(): string[] {
    return Array.from(this.plugins.keys());
  }
}

export const Config = Schema.object({
  autoReload: Schema.boolean().default(true),
});

export function apply(ctx: Context, config: any) {
  const service = new PluginManagerService(ctx);
  (ctx as any).plugins = service;
}
