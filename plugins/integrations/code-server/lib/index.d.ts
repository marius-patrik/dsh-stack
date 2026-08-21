import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "code-server";
export declare const inject: string[];
export declare const optional: string[];
export declare class CodeServerManager {
    getStatus(): {
        running: boolean;
        port: number;
    };
}
export declare const Config: Schema<Schemastery.ObjectS<{
    port: Schema<number, number>;
    auth: Schema<string, string>;
}>, Schemastery.ObjectT<{
    port: Schema<number, number>;
    auth: Schema<string, string>;
}>>;
export declare function apply(ctx: Context): void;
