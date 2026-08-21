import Schema from '@deepseek-ai/schemastery';
export const name = 'bun-cli';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers bun-cli interactive tmux runner
}
