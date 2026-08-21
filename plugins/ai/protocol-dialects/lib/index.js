import Schema from '@deepseek-ai/schemastery';
export const name = 'protocol-dialects';
export const inject = [];
export const optional = [];
export class DialectsService {
    serializers = new Map();
    register(name, serializer) {
        this.serializers.set(name, serializer);
    }
    get(name) {
        return this.serializers.get(name);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.dialects = new DialectsService();
}
