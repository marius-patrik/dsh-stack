import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "providers-registry";
export declare const inject: string[];
export declare const optional: string[];
export interface ProviderRoute {
    id: string;
    name: string;
    type: 'subscription' | 'api-key' | 'local' | 'zen';
    models: string[];
    status: 'available' | 'exhausted' | 'disabled';
}
export declare class ProvidersRegistryService {
    private routes;
    registerRoute(route: ProviderRoute): void;
    getRoute(id: string): ProviderRoute | undefined;
    listRoutes(): ProviderRoute[];
}
export declare class QuotasService {
    private meters;
    setQuota(provider: string, used: number, limit: number): void;
    getQuota(provider: string): {
        used: number;
        limit: number;
        remaining: number;
    } | undefined;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
