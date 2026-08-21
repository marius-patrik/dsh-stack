import Schema from '@deepseek-ai/schemastery';
export const name = 'lsp-client';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional = [];
export class LspClientService {
    servers = new Map();
    registerServer(lang, server) {
        this.servers.set(lang, server);
    }
    getServer(lang) {
        return this.servers.get(lang);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.lsp = new LspClientService();
}
