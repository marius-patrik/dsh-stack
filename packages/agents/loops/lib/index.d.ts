import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "loops";
export declare const inject: string[];
export declare const optional: string[];
export declare class DarkFactoryLoopService {
    private activeLoops;
    startGoal(id: string, goal: string): void;
    getGoal(id: string): {
        goal: string;
        status: "running" | "idle";
    } | undefined;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
