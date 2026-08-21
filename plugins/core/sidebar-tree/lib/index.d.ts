import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "sidebar-tree";
export declare const inject: string[];
export declare const optional: string[];
export declare const Config: Schema<Schemastery.ObjectS<{
    showArchived: Schema<boolean, boolean>;
    strictTriColor: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    showArchived: Schema<boolean, boolean>;
    strictTriColor: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context): void;
