import Schema from '@deepseek-ai/schemastery';
export const name = 'nvm-cli';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers nvm-cli interactive tmux runner
}
