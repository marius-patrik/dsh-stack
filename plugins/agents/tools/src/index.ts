import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'tools';
export const inject = ['webServer', 'slots'];
export const optional: string[] = [];

export interface ModelTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (params: any) => Promise<any> | any;
}

export class ToolsRegistryService {
  private tools = new Map<string, ModelTool>();

  registerTool(tool: ModelTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ModelTool | undefined {
    return this.tools.get(name);
  }

  all(): ModelTool[] {
    return Array.from(this.tools.values());
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).tools = new ToolsRegistryService();
}
