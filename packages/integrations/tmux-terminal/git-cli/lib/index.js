import Schema from '@deepseek-ai/schemastery';
export const name = 'git-cli';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers git-cli interactive tmux runner
}
