import Schema from '@deepseek-ai/schemastery';
export const name = 'ollama-cli';
export const inject = ['tmux'];
export const optional = ["claude", "hermes"];
export const Config = Schema.object({});
export function apply(ctx) {
    // Registers ollama-cli interactive tmux runner
}
