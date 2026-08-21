import Schema from '@deepseek-ai/schemastery';
export const name = 'code-editor';
export const inject = ['tools', 'webServer', 'slots'];
export const optional = ['icons'];
export class CodeEditorService {
    ctx;
    buffers = new Map();
    activePath = null;
    constructor(ctx) {
        this.ctx = ctx;
        this.listenToLspEvents();
    }
    openBuffer(path, content = '', language) {
        const lang = language || this.detectLanguage(path);
        let buf = this.buffers.get(path);
        if (!buf) {
            buf = {
                path,
                language: lang,
                content,
                originalContent: content,
                dirty: false,
                markers: []
            };
            this.buffers.set(path, buf);
        }
        this.activePath = path;
        if (this.ctx.emit) {
            this.ctx.emit('editor:buffer-opened', buf);
        }
        return buf;
    }
    updateContent(path, newContent) {
        const buf = this.buffers.get(path);
        if (buf) {
            buf.content = newContent;
            buf.dirty = buf.content !== buf.originalContent;
            if (this.ctx.emit) {
                this.ctx.emit('editor:buffer-changed', { path, dirty: buf.dirty });
            }
        }
    }
    saveBuffer(path) {
        const buf = this.buffers.get(path);
        if (!buf)
            return false;
        buf.originalContent = buf.content;
        buf.dirty = false;
        if (this.ctx.emit) {
            this.ctx.emit('editor:buffer-saved', { path, content: buf.content });
        }
        return true;
    }
    closeBuffer(path) {
        this.buffers.delete(path);
        if (this.activePath === path) {
            const remaining = Array.from(this.buffers.keys());
            this.activePath = remaining.length > 0 ? remaining[0] || null : null;
        }
    }
    getBuffer(path) {
        return this.buffers.get(path);
    }
    getActiveBuffer() {
        return this.activePath ? this.buffers.get(this.activePath) || null : null;
    }
    setMarkers(path, markers) {
        const buf = this.buffers.get(path);
        if (buf) {
            buf.markers = markers;
            if (this.ctx.emit) {
                this.ctx.emit('editor:markers-updated', { path, markers });
            }
        }
    }
    detectLanguage(filePath) {
        const ext = filePath.includes('.') ? filePath.split('.').pop()?.toLowerCase() || '' : '';
        const map = {
            ts: 'typescript',
            tsx: 'typescriptreact',
            js: 'javascript',
            jsx: 'javascriptreact',
            py: 'python',
            rs: 'rust',
            go: 'go',
            json: 'json',
            yaml: 'yaml',
            yml: 'yaml',
            md: 'markdown',
            html: 'html',
            css: 'css',
            sh: 'shell'
        };
        return map[ext] || 'plaintext';
    }
    listenToLspEvents() {
        if (this.ctx.on) {
            this.ctx.on('lsp:diagnostics', (data) => {
                const markers = (data.diagnostics || []).map((d) => ({
                    startLine: d.range?.start?.line ?? 1,
                    startColumn: d.range?.start?.character ?? 1,
                    endLine: d.range?.end?.line ?? 1,
                    endColumn: d.range?.end?.character ?? 1,
                    message: d.message || '',
                    severity: d.severity === 1 ? 'error' : d.severity === 2 ? 'warning' : 'info'
                }));
                this.setMarkers(data.filePath, markers);
            });
        }
    }
}
export const Config = Schema.object({
    fontSize: Schema.number().default(13),
    tabSize: Schema.number().default(2),
    minimap: Schema.boolean().default(true),
    wordWrap: Schema.boolean().default(true)
});
export function apply(ctx, config) {
    const service = new CodeEditorService(ctx);
    ctx.codeEditor = service;
}
