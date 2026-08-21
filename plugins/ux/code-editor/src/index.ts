import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'code-editor';
export const inject = ['tools', 'webServer', 'slots'];
export const optional = ['icons'];

export interface OpenEditorOptions {
  path: string;
  content?: string;
  readOnly?: boolean;
  language?: string;
}

export class CodeEditorService {
  private openBuffers = new Map<string, { path: string; dirty: boolean; content: string }>();

  open(opts: OpenEditorOptions): void {
    this.openBuffers.set(opts.path, { path: opts.path, dirty: false, content: opts.content || '' });
  }

  save(path: string, newContent: string): void {
    const buf = this.openBuffers.get(path);
    if (buf) {
      buf.content = newContent;
      buf.dirty = false;
    }
  }

  getBuffer(path: string) {
    return this.openBuffers.get(path);
  }
}

export const Config = Schema.object({
  fontSize: Schema.number().default(13),
  tabSize: Schema.number().default(2),
  minimap: Schema.boolean().default(true),
});

export function apply(ctx: Context) {
  (ctx as any).codeEditor = new CodeEditorService();
}
