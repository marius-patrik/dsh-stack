import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "actions";
export declare const inject: string[];
export declare const optional: string[];
export interface ActionContext {
    sessionId: string;
    mode: 'code' | 'architect' | 'ask' | 'standard';
    toolPolicy: 'auto' | 'confirm' | 'deny';
}
export declare class ActionsService {
    private activeActions;
    setAction(sessionId: string, mode: ActionContext['mode']): void;
    getAction(sessionId: string): ActionContext | undefined;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
