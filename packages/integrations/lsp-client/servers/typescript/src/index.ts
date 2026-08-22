import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'lsp-server-typescript';
export const inject = ['lsp', 'tools'];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  if ((ctx as any).lsp) {
    (ctx as any).lsp.registerServer('typescript', { name: 'typescript-server' });
  }
}
