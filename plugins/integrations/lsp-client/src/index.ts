import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'lsp-client';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional: string[] = [];

export class LspClientService {
  private servers = new Map<string, any>();

  registerServer(lang: string, server: any): void {
    this.servers.set(lang, server);
  }

  getServer(lang: string) {
    return this.servers.get(lang);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).lsp = new LspClientService();
}
