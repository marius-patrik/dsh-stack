import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "pack-integrations";
export declare const inject: string[];
export declare const optional: string[];
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
