import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "plugin-manager";
export declare const inject: string[];
export declare const optional: string[];
export interface PluginManifest {
    name: string;
    version: string;
    inject: string[];
    optional: string[];
    status: 'active' | 'inactive' | 'error';
    pack?: string;
}
export declare class PluginManagerService {
    private ctx;
    private plugins;
    constructor(ctx: Context);
    register(manifest: PluginManifest): void;
    get(name: string): PluginManifest | undefined;
    all(): PluginManifest[];
    resolveDAG(): string[];
}
export declare const Config: Schema<Schemastery.ObjectS<{
    autoReload: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    autoReload: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context, config: any): void;
