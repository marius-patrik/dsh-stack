import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "lsp-client";
export declare const inject: string[];
export declare const optional: string[];
export interface LspPosition {
    line: number;
    character: number;
}
export interface LspRange {
    start: LspPosition;
    end: LspPosition;
}
export interface LspDiagnostic {
    range: LspRange;
    severity: 1 | 2 | 3 | 4;
    message: string;
    source?: string;
}
export interface LspHoverResult {
    contents: string | string[];
    range?: LspRange;
}
export interface LspDefinitionResult {
    uri: string;
    range: LspRange;
}
export interface LspServerHandler {
    name: string;
    languages: string[];
    getHover?: (uri: string, pos: LspPosition) => Promise<LspHoverResult | null>;
    getDefinition?: (uri: string, pos: LspPosition) => Promise<LspDefinitionResult[] | null>;
    getDiagnostics?: (uri: string) => Promise<LspDiagnostic[]>;
    getReferences?: (uri: string, pos: LspPosition) => Promise<LspDefinitionResult[]>;
}
export declare class LspClientService {
    private ctx;
    private servers;
    private diagnosticsCache;
    constructor(ctx: Context);
    registerServer(lang: string, server: LspServerHandler): void;
    getServerForFile(filePath: string): LspServerHandler | undefined;
    setDiagnostics(filePath: string, diagnostics: LspDiagnostic[]): void;
    getDiagnostics(filePath: string): LspDiagnostic[];
    private registerLspTools;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    enableAutoHover: Schema<boolean, boolean>;
    diagnosticsDebounceMs: Schema<number, number>;
}>, Schemastery.ObjectT<{
    enableAutoHover: Schema<boolean, boolean>;
    diagnosticsDebounceMs: Schema<number, number>;
}>>;
export declare function apply(ctx: Context, config: any): void;
