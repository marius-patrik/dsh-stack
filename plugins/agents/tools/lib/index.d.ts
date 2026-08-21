import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "tools";
export declare const inject: string[];
export declare const optional: string[];
export interface ModelTool {
    name: string;
    description: string;
    parameters: Record<string, any>;
    execute: (params: any) => Promise<any> | any;
}
export declare class ToolsRegistryService {
    private tools;
    registerTool(tool: ModelTool): void;
    getTool(name: string): ModelTool | undefined;
    all(): ModelTool[];
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
