import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'translator';
export const inject = ['dialects', 'llm'];
export const optional: string[] = [];

export class TranslatorService {
  translatePrompt(sourceDialect: string, targetDialect: string, message: any) {
    return message;
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).translator = new TranslatorService();
}
