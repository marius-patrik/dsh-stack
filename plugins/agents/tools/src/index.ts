import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'tools';
export const inject = ['webServer', 'slots'];
export const optional: string[] = [];

export interface ModelToolParameter {
  type: string;
  description: string;
  enum?: string[];
  default?: any;
}

export interface ModelTool {
  name: string;
  description: string;
  parameters: {
    type?: string;
    properties?: Record<string, ModelToolParameter>;
    required?: string[];
  };
  execute: (params: any, meta?: { sessionId?: string; ctx?: Context }) => Promise<any> | any;
}

export class ToolsRegistryService {
  private tools = new Map<string, ModelTool>();
  private mcpServers = new Map<string, { url: string; tools: string[] }>();

  constructor(private ctx: Context) {}

  registerTool(tool: ModelTool): void {
    if (!tool.name) throw new Error('Tool must have a valid name');
    this.tools.set(tool.name, tool);
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit('tools:registered', tool);
    }
  }

  unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  getTool(name: string): ModelTool | undefined {
    return this.tools.get(name);
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  all(): ModelTool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, params: any, meta?: { sessionId?: string }): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered in the tool registry`);
    }
    return await tool.execute(params, { ...meta, ctx: this.ctx });
  }

  registerMcpServer(id: string, url: string, tools: string[] = []): void {
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

export function apply(ctx: Context, config: any) {
  const service = new ToolsRegistryService(ctx);
  (ctx as any).tools = service;
}
