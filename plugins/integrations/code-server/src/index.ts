import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'code-server';
export const inject = ['integrations', 'webServer', 'slots'];
export const optional: string[] = [];

export class CodeServerManager {
  getStatus() {
    return { running: false, port: 8080 };
  }
}

export const Config = Schema.object({
  port: Schema.number().default(8080),
  auth: Schema.string().default('none'),
});

export function apply(ctx: Context) {
  (ctx as any).codeServer = new CodeServerManager();
}
