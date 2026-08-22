import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "protocol-dialects";
export declare const inject: string[];
export declare const optional: string[];
export interface DialectSerializer {
    name: string;
    serializeRequest: (body: any) => any;
    parseStreamChunk: (chunk: string) => any;
}
export declare class DialectsService {
    private serializers;
    register(name: string, serializer: DialectSerializer): void;
    get(name: string): DialectSerializer | undefined;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
