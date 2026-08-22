import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "package-managers";
export declare const inject: string[];
export declare const optional: string[];
export interface DetectedRuntime {
    type: 'bun' | 'pnpm' | 'npm' | 'yarn' | 'cargo' | 'uv' | 'pip';
    lockfile: string;
    command: string;
    versionRequired?: string;
}
export declare class PackageManagersService {
    private ctx;
    private customRunners;
    constructor(ctx: Context);
    detect(projectPath: string): DetectedRuntime[];
    private registerPackageTools;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    preferBun: Schema<boolean, boolean>;
    autoSwitchNode: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    preferBun: Schema<boolean, boolean>;
    autoSwitchNode: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context, config: any): void;
