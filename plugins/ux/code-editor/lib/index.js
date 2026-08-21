import Schema from '@deepseek-ai/schemastery';
export const name = 'code-editor';
export const inject = ['tools', 'webServer', 'slots'];
export const optional = ['icons'];
export class CodeEditorService {
    openBuffers = new Map();
    open(opts) {
        this.openBuffers.set(opts.path, { path: opts.path, dirty: false, content: opts.content || '' });
    }
    save(path, newContent) {
        const buf = this.openBuffers.get(path);
        if (buf) {
            buf.content = newContent;
            buf.dirty = false;
        }
    }
    getBuffer(path) {
        return this.openBuffers.get(path);
    }
}
export const Config = Schema.object({
    fontSize: Schema.number().default(13),
    tabSize: Schema.number().default(2),
    minimap: Schema.boolean().default(true),
});
export function apply(ctx) {
    ctx.codeEditor = new CodeEditorService();
}
