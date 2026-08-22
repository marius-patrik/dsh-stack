/**
 * `dsh-translator`: translates between provider-native session, skill, and hook
 * file formats and the dsh-stack optimized format.
 *
 * Supported formats:
 * - opencode: messages[] with role/content structure
 * - claude: entries[] with type/text structure
 * - dsh: events[] with type/seq/data structure (native harness format)
 *
 * The translator can convert any supported format to any other, and can batch
 * convert entire session directories.
 *
 * @module dsh-translator
 */
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "dsh-translator";
export declare const inject: string[];
export type Format = 'opencode' | 'claude' | 'dsh';
export interface OpenCodeMessage {
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{
        type: string;
        text?: string;
        [key: string]: unknown;
    }>;
    timestamp?: string;
    [key: string]: unknown;
}
export interface ClaudeEntry {
    type: 'human' | 'assistant' | 'tool_use' | 'tool_result';
    text?: string;
    content?: string;
    [key: string]: unknown;
}
export interface DshEvent {
    type: string;
    seq: number;
    role?: string;
    content?: Array<{
        type: string;
        text?: string;
        [key: string]: unknown;
    }>;
    timestamp?: string;
    [key: string]: unknown;
}
export declare function detectFormat(data: unknown): Format | null;
export type TranslateFn = (input: unknown) => unknown;
export declare class TranslatorRegistry {
    private readonly converters;
    register(sourceFormat: Format, targetFormat: Format, fn: TranslateFn): void;
    translate(data: unknown, sourceFormat: Format, targetFormat: Format): unknown;
    supportedConversions(): string[];
}
export interface Config {
    /** Default target format for CLI translations. */
    defaultFormat?: Format;
}
export declare function apply(ctx: Context, _config?: Config): void;
