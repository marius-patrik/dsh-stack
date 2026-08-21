import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "icon-engine";
export declare const inject: string[];
export declare const optional: string[];
export interface IconPack {
    id: string;
    name: string;
    getIcon(name: string): string | null;
}
export declare class IconEngineService {
    private packs;
    private mappings;
    registerPack(pack: IconPack): void;
    setMapping(pattern: string, iconId: string): void;
    resolveIcon(fileNameOrType: string): string | null;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
