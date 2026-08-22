import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "tools";
export declare const inject: string[];
export declare const optional: string[];
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
    execute: (params: any, meta?: {
        sessionId?: string;
        ctx?: Context;
    }) => Promise<any> | any;
}
export declare class ToolsRegistryService {
    private ctx;
    private tools;
    private mcpServers;
    constructor(ctx: Context);
    registerTool(tool: ModelTool): void;
    unregisterTool(name: string): boolean;
    getTool(name: string): ModelTool | undefined;
    hasTool(name: string): boolean;
    all(): ModelTool[];
    executeTool(name: string, params: any, meta?: {
        sessionId?: string;
    }): Promise<any>;
    registerMcpServer(id: string, url: string, tools?: string[]): void;
    listMcpServers(): {
        url: string;
        tools: string[];
        id: string;
    }[];
}
export declare const Config: Schema<Schemastery.ObjectS<{
    enableMcp: Schema<boolean, boolean>;
    autoApproveReadOnly: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    enableMcp: Schema<boolean, boolean>;
    autoApproveReadOnly: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context, config: any): void;
