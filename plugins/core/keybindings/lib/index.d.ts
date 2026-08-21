import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "keybindings";
export declare const inject: string[];
export declare const optional: string[];
export interface KeybindingRule {
    id: string;
    label: string;
    keys: string;
    action: () => void;
}
export declare class KeybindingsService {
    private bindings;
    register(rule: KeybindingRule): void;
    get(id: string): KeybindingRule | undefined;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
