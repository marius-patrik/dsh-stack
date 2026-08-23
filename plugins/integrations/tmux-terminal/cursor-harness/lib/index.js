import Schema from '@deepseek-ai/schemastery';
export const name = 'cursor-harness';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers cursor-harness interactive tmux runner
}
