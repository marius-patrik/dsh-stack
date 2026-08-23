import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "code-server";
export declare const inject: string[];
export declare const optional: string[];
export interface CodeServerStatus {
    running: boolean;
    port: number;
    host: string;
    url: string;
    pid?: number;
}
export declare class CodeServerManager {
    private ctx;
    private config;
    private status;
    constructor(ctx: Context, config: any);
    getStatus(): CodeServerStatus;
    startServer(): Promise<CodeServerStatus>;
    stopServer(): Promise<boolean>;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    port: Schema<number, number>;
    auth: Schema<string, string>;
    telemetry: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    port: Schema<number, number>;
    auth: Schema<string, string>;
    telemetry: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context, config: any): void;
