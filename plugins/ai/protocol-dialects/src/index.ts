import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "protocol-dialects";
export const inject: string[] = [];
export const optional: string[] = [];

export interface DialectSerializer {
  name: string;
  serializeRequest: (body: any) => any;
  parseStreamChunk: (chunk: string) => any;
}

export class DialectsService {
  private serializers = new Map<string, DialectSerializer>();

    /** register implementation. */
register(name: string, serializer: DialectSerializer): void {
    this.serializers.set(name, serializer);
  }

    /** get implementation. */
get(name: string) {
    return this.serializers.get(name);
  }
}

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  (ctx as any).dialects = new DialectsService();
}
