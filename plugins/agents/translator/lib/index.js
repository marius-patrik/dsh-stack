import Schema from '@deepseek-ai/schemastery';
export const name = 'translator';
export const inject = ['dialects', 'llm'];
export const optional = [];
export class TranslatorService {
    translatePrompt(sourceDialect, targetDialect, message) {
        return message;
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.translator = new TranslatorService();
}
