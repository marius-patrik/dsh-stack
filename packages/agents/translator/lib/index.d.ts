import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "translator";
export declare const inject: string[];
export declare const optional: string[];
export declare class TranslatorService {
    translatePrompt(sourceDialect: string, targetDialect: string, message: any): any;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
