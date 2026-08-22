import Schema from '@deepseek-ai/schemastery';
export const name = 'keybindings';
export const inject = ['slots'];
export const optional = [];
export class KeybindingsService {
    bindings = new Map();
    register(rule) {
        this.bindings.set(rule.id, rule);
    }
    get(id) {
        return this.bindings.get(id);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.keybindings = new KeybindingsService();
}
