import Schema from '@deepseek-ai/schemastery';
export const name = 'kimi-harness';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers kimi-harness interactive tmux runner
}
