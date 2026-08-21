import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "lsp-client";
export declare const inject: string[];
export declare const optional: string[];
export declare class LspClientService {
    private servers;
    registerServer(lang: string, server: any): void;
    getServer(lang: string): any;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
