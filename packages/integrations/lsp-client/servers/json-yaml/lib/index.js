import Schema from '@deepseek-ai/schemastery';
export const name = 'lsp-server-json-yaml';
export const inject = ['lsp', 'tools'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    if (ctx.lsp) {
        ctx.lsp.registerServer('json-yaml', { name: 'json-yaml-server' });
    }
}
