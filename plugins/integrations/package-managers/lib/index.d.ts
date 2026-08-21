import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "package-managers";
export declare const inject: string[];
export declare const optional: string[];
export interface DetectedRuntime {
    type: 'bun' | 'pnpm' | 'npm' | 'yarn' | 'cargo' | 'uv';
    lockfile: string;
}
export declare class PackageManagersService {
    detect(projectPath: string): DetectedRuntime[];
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
