import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'code-editor';
export const inject = ['tools', 'webServer', 'slots'];
export const optional = ['icons'];

export interface EditorMarker {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface EditorBuffer {
  path: string;
  language: string;
  content: string;
  originalContent: string;
  dirty: boolean;
  markers: EditorMarker[];
}

export class CodeEditorService {
  private buffers = new Map<string, EditorBuffer>();
  private activePath: string | null = null;

  constructor(private ctx: Context) {
    this.listenToLspEvents();
  }

  openBuffer(path: string, content: string = '', language?: string): EditorBuffer {
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
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit('editor:buffer-opened', buf);
    }
    return buf;
  }

  updateContent(path: string, newContent: string): void {
    const buf = this.buffers.get(path);
    if (buf) {
      buf.content = newContent;
      buf.dirty = buf.content !== buf.originalContent;
      if ((this.ctx as any).emit) {
        (this.ctx as any).emit('editor:buffer-changed', { path, dirty: buf.dirty });
      }
    }
  }

  saveBuffer(path: string): boolean {
    const buf = this.buffers.get(path);
    if (!buf) return false;
    buf.originalContent = buf.content;
    buf.dirty = false;
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit('editor:buffer-saved', { path, content: buf.content });
    }
    return true;
  }

  closeBuffer(path: string): void {
    this.buffers.delete(path);
    if (this.activePath === path) {
      const remaining = Array.from(this.buffers.keys());
      this.activePath = remaining.length > 0 ? remaining[0] || null : null;
    }
  }

  getBuffer(path: string): EditorBuffer | undefined {
    return this.buffers.get(path);
  }

  getActiveBuffer(): EditorBuffer | null {
    return this.activePath ? this.buffers.get(this.activePath) || null : null;
  }

  setMarkers(path: string, markers: EditorMarker[]): void {
    const buf = this.buffers.get(path);
    if (buf) {
      buf.markers = markers;
      if ((this.ctx as any).emit) {
        (this.ctx as any).emit('editor:markers-updated', { path, markers });
      }
    }
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.includes('.') ? filePath.split('.').pop()?.toLowerCase() || '' : '';
    const map: Record<string, string> = {
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

  private listenToLspEvents(): void {
    if ((this.ctx as any).on) {
      (this.ctx as any).on('lsp:diagnostics', (data: { filePath: string; diagnostics: any[] }) => {
        const markers: EditorMarker[] = (data.diagnostics || []).map((d) => ({
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

export function apply(ctx: Context, config: any) {
  const service = new CodeEditorService(ctx);
  (ctx as any).codeEditor = service;
}
