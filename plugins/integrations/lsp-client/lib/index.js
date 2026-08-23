import Schema from '@deepseek-ai/schemastery';
export const name = 'lsp-client';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional = [];
export class LspClientService {
    ctx;
    servers = new Map();
    diagnosticsCache = new Map();
    constructor(ctx) {
        this.ctx = ctx;
        this.registerLspTools();
    }
    registerServer(lang, server) {
        this.servers.set(lang, server);
        for (const l of server.languages || [lang]) {
            this.servers.set(l, server);
        }
    }
    getServerForFile(filePath) {
        const ext = filePath.includes('.') ? filePath.split('.').pop() || '' : filePath;
        return this.servers.get(ext);
    }
    setDiagnostics(filePath, diagnostics) {
        this.diagnosticsCache.set(filePath, diagnostics);
        if (this.ctx.emit) {
            this.ctx.emit('lsp:diagnostics', { filePath, diagnostics });
        }
    }
    getDiagnostics(filePath) {
        return this.diagnosticsCache.get(filePath) || [];
    }
    registerLspTools() {
        const tools = this.ctx.tools;
        if (!tools || typeof tools.registerTool !== 'function')
            return;
        // 1. lsp_hover
        tools.registerTool({
            name: 'lsp_hover',
            description: 'Get hover type information and docstrings for a symbol at a specific file position',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                    line: { type: 'number', description: 'Line number (0-indexed)' },
                    character: { type: 'number', description: 'Character column (0-indexed)' }
                },
                required: ['path', 'line', 'character']
            },
            execute: async (params) => {
                const s = this.getServerForFile(params.path);
                if (s && s.getHover) {
                    return await s.getHover(params.path, { line: params.line, character: params.character });
                }
                return { contents: `No active LSP server for ${params.path}` };
            }
        });
        // 2. lsp_definition
        tools.registerTool({
            name: 'lsp_definition',
            description: 'Find definition target for symbol at cursor',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' },
                    line: { type: 'number', description: 'Line number (0-indexed)' },
                    character: { type: 'number', description: 'Character column (0-indexed)' }
                },
                required: ['path', 'line', 'character']
            },
            execute: async (params) => {
                const s = this.getServerForFile(params.path);
                if (s && s.getDefinition) {
                    return await s.getDefinition(params.path, { line: params.line, character: params.character });
                }
                return [];
            }
        });
        // 3. lsp_diagnostics
        tools.registerTool({
            name: 'lsp_diagnostics',
            description: 'Get live lint and compiler diagnostics for a file',
            parameters: {
                type: 'object',
                properties: {
                    path: { type: 'string', description: 'File path' }
                },
                required: ['path']
            },
            execute: async (params) => {
                const s = this.getServerForFile(params.path);
                if (s && s.getDiagnostics) {
                    const fresh = await s.getDiagnostics(params.path);
                    this.setDiagnostics(params.path, fresh);
                    return fresh;
                }
                return this.getDiagnostics(params.path);
            }
        });
    }
}
export const Config = Schema.object({
    enableAutoHover: Schema.boolean().default(true),
    diagnosticsDebounceMs: Schema.number().default(250),
});
export function apply(ctx, config) {
    const service = new LspClientService(ctx);
    ctx.lsp = service;
}
