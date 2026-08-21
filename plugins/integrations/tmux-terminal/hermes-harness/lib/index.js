import Schema from '@deepseek-ai/schemastery';
export const name = 'hermes-harness';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers hermes-harness interactive tmux runner
}
