import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "code-editor";
export declare const inject: string[];
export declare const optional: string[];
export interface EditorMarker {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}
export interface EditorBuffer {
    path: string;
    language: string;
    content: string;
    originalContent: string;
    dirty: boolean;
    markers: EditorMarker[];
}
export declare class CodeEditorService {
    private ctx;
    private buffers;
    private activePath;
    constructor(ctx: Context);
    openBuffer(path: string, content?: string, language?: string): EditorBuffer;
    updateContent(path: string, newContent: string): void;
    saveBuffer(path: string): boolean;
    closeBuffer(path: string): void;
    getBuffer(path: string): EditorBuffer | undefined;
    getActiveBuffer(): EditorBuffer | null;
    setMarkers(path: string, markers: EditorMarker[]): void;
    private detectLanguage;
    private listenToLspEvents;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    fontSize: Schema<number, number>;
    tabSize: Schema<number, number>;
    minimap: Schema<boolean, boolean>;
    wordWrap: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    fontSize: Schema<number, number>;
    tabSize: Schema<number, number>;
    minimap: Schema<boolean, boolean>;
    wordWrap: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context, config: any): void;
