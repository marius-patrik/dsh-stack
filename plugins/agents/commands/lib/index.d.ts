import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "commands";
export declare const inject: string[];
export declare const optional: string[];
export interface SlashCommand {
    name: string;
    description: string;
    execute: (args: string) => Promise<any> | any;
}
export declare class CommandsService {
    private commands;
    register(cmd: SlashCommand): void;
    list(): SlashCommand[];
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
