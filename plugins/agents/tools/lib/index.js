import Schema from '@deepseek-ai/schemastery';
export const name = 'tools';
export const inject = ['webServer', 'slots'];
export const optional = [];
export class ToolsRegistryService {
    ctx;
    tools = new Map();
    mcpServers = new Map();
    constructor(ctx) {
        this.ctx = ctx;
    }
    registerTool(tool) {
        if (!tool.name)
            throw new Error('Tool must have a valid name');
        this.tools.set(tool.name, tool);
        if (this.ctx.emit) {
            this.ctx.emit('tools:registered', tool);
        }
    }
    unregisterTool(name) {
        return this.tools.delete(name);
    }
    getTool(name) {
        return this.tools.get(name);
    }
    hasTool(name) {
        return this.tools.has(name);
    }
    all() {
        return Array.from(this.tools.values());
    }
    async executeTool(name, params, meta) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`Tool "${name}" is not registered in the tool registry`);
        }
        return await tool.execute(params, { ...meta, ctx: this.ctx });
    }
    registerMcpServer(id, url, tools = []) {
        this.mcpServers.set(id, { url, tools });
    }
    listMcpServers() {
        return Array.from(this.mcpServers.entries()).map(([id, s]) => ({ id, ...s }));
    }
}
export const Config = Schema.object({
    enableMcp: Schema.boolean().default(true),
    autoApproveReadOnly: Schema.boolean().default(true),
});
export function apply(ctx, config) {
    const service = new ToolsRegistryService(ctx);
    ctx.tools = service;
}
