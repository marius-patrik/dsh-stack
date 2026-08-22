import Schema from '@deepseek-ai/schemastery';
export const name = 'lsp-server-python';
export const inject = ['lsp', 'tools'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    if (ctx.lsp) {
        ctx.lsp.registerServer('python', { name: 'python-server' });
    }
}
