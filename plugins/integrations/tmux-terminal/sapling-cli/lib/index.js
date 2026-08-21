import Schema from '@deepseek-ai/schemastery';
export const name = 'sapling-cli';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers sapling-cli interactive tmux runner
}
