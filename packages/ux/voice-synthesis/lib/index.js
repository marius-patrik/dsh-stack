import Schema from '@deepseek-ai/schemastery';
export const name = 'voice-synthesis';
export const inject = ['webServer', 'slots'];
export const optional = ['llm'];
export class VoiceSynthesisService {
    speak(text) {
        return true;
    }
}
export const Config = Schema.object({
    enabled: Schema.boolean().default(true),
    voice: Schema.string().default('default')
});
export function apply(ctx) {
    ctx.voice = new VoiceSynthesisService();
}
