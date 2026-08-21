import Schema from '@deepseek-ai/schemastery';
export const name = 'tools';
export const inject = ['webServer', 'slots'];
export const optional = [];
export class ToolsRegistryService {
    tools = new Map();
    registerTool(tool) {
        this.tools.set(tool.name, tool);
    }
    getTool(name) {
        return this.tools.get(name);
    }
    all() {
        return Array.from(this.tools.values());
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.tools = new ToolsRegistryService();
}
