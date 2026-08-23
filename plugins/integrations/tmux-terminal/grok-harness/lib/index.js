import Schema from '@deepseek-ai/schemastery';
export const name = 'grok-harness';
export const inject = ['tmux'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers grok-harness interactive tmux runner
}
