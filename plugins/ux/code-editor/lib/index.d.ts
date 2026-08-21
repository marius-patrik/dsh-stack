import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "code-editor";
export declare const inject: string[];
export declare const optional: string[];
export interface OpenEditorOptions {
    path: string;
    content?: string;
    readOnly?: boolean;
    language?: string;
}
export declare class CodeEditorService {
    private openBuffers;
    open(opts: OpenEditorOptions): void;
    save(path: string, newContent: string): void;
    getBuffer(path: string): {
        path: string;
        dirty: boolean;
        content: string;
    } | undefined;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    fontSize: Schema<number, number>;
    tabSize: Schema<number, number>;
    minimap: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    fontSize: Schema<number, number>;
    tabSize: Schema<number, number>;
    minimap: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context): void;
