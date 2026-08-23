import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "integrations-registry";
export declare const inject: string[];
export declare const optional: string[];
export interface IntegrationEntry {
    id: string;
    name: string;
    category: 'sandbox' | 'editor' | 'tool' | 'vcs' | 'runtime' | 'network';
    installed: boolean;
    status: 'online' | 'standby' | 'error';
    version?: string;
}
export declare class IntegrationsRegistryService {
    private registry;
    register(entry: IntegrationEntry): void;
    get(id: string): IntegrationEntry | undefined;
    all(): IntegrationEntry[];
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
