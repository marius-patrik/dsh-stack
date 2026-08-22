import { Service, type Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'tools'
export const inject = ['webServer', 'slots']
export const optional: string[] = []

export interface ModelToolParameter {
  type: string
  description: string
  enum?: string[]
  default?: unknown
}

export interface ModelTool {
  name: string
  description: string
  parameters: {
    type?: string
    properties?: Record<string, ModelToolParameter>
    required?: string[]
  }
  execute: (params: Record<string, unknown>, meta?: { sessionId?: string; ctx?: Context }) => Promise<unknown> | unknown
}

export class ToolsRegistryService extends Service {
  static inject = ['webServer', 'slots']
  private readonly tools = new Map<string, ModelTool>()
  private readonly mcpServers = new Map<string, { url: string; tools: string[] }>()

  constructor(ctx: Context) {
    super(ctx, 'tools')
  }

  registerTool(tool: ModelTool): void {
    if (!tool.name.trim()) throw new Error('Tool must have a valid name')
    this.tools.set(tool.name, tool)
    this.ctx.emit('tools:registered', tool)
  }

  unregisterTool(name: string): boolean {
    return this.tools.delete(name)
  }

  getTool(name: string): ModelTool | undefined {
    return this.tools.get(name)
  }

  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  all(): ModelTool[] {
    return Array.from(this.tools.values())
  }

  async executeTool(name: string, params: Record<string, unknown>, meta?: { sessionId?: string }): Promise<unknown> {
    const tool = this.tools.get(name)
    if (!tool) throw new Error(`Tool "${name}" is not registered in the tool registry`)
    return await tool.execute(params, { ...meta, ctx: this.ctx })
  }

  registerMcpServer(id: string, url: string, tools: string[] = []): void {
    this.mcpServers.set(id, { url, tools: [...tools] })
  }

  listMcpServers(): Array<{ id: string; url: string; tools: string[] }> {
    return Array.from(this.mcpServers.entries()).map(([id, server]) => ({ id, ...server, tools: [...server.tools] }))
  }
}

export const Config = Schema.object({
  enableMcp: Schema.boolean().default(true),
  autoApproveReadOnly: Schema.boolean().default(true),
})

export function apply(ctx: Context): void {
  new ToolsRegistryService(ctx)
}
