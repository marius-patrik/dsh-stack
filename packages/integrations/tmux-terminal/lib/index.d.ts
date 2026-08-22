import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "tmux-terminal";
export declare const inject: string[];
export declare const optional: string[];
export interface TmuxSession {
    id: string;
    name: string;
    command: string;
    cwd: string;
    running: boolean;
    history: string[];
    createdAt: number;
}
export declare class TmuxService {
    private ctx;
    private sessions;
    constructor(ctx: Context);
    createSession(name: string, command?: string, cwd?: string): TmuxSession;
    sendInput(id: string, input: string): boolean;
    captureOutput(id: string, linesCount?: number): string;
    listSessions(): TmuxSession[];
    killSession(id: string): boolean;
    private registerTmuxTools;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    shell: Schema<string, string>;
    scrollback: Schema<number, number>;
}>, Schemastery.ObjectT<{
    shell: Schema<string, string>;
    scrollback: Schema<number, number>;
}>>;
export declare function apply(ctx: Context, config: any): void;
