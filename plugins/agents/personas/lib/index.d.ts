import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "personas";
export declare const inject: string[];
export declare const optional: string[];
export interface AgentPersona {
    id: string;
    name: string;
    role: string;
    systemPrompt: string;
    model?: string;
    tools?: string[];
}
export declare class PersonasService {
    private roster;
    register(persona: AgentPersona): void;
    get(id: string): AgentPersona | undefined;
    list(): AgentPersona[];
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
