import Schema from '@deepseek-ai/schemastery';
export const name = 'lsp-server-rust';
export const inject = ['lsp', 'tools'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    if (ctx.lsp) {
        ctx.lsp.registerServer('rust', { name: 'rust-server' });
    }
}
