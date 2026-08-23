import Schema from '@deepseek-ai/schemastery';
export const name = 'npm-cli';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers npm-cli interactive tmux runner
}
