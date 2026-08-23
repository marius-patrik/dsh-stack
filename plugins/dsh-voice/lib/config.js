/**
 * The `voice` settings namespace schema. This plugin consumes and extends the
 * harness' existing `voice` seam (the namespace the voice tooling already
 * registers), keeping the established `stt` keys and adding the neural-TTS
 * `tts` table and the `readAloud` section. Credentials are references into
 * the dsh account vault (`credentialRef`), never stored values.
 * @module dsh-voice/config
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
/** The settings namespace this plugin owns. */
export const VOICE_NS = settingsNamespace('voice');
export const TtsConfig = z.object({
    enabled: z.boolean().default(true),
    provider: z.string().default('openai'),
    apiBase: z.string().default(''),
    path: z.string().default(''),
    credentialRef: z.string().role('credential-ref').default('OPENAI_API_KEY'),
    model: z.string().default('gpt-4o-mini-tts'),
    voice: z.string().default('nova'),
    speed: z.number().min(0.25).max(4).default(1),
    format: z.string().default('mp3'),
    instructions: z.string().default(''),
    timeoutMs: z.number().min(1).default(60000),
});
export const SttEngine = z.union([
    z.const('auto'),
    z.const('browser'),
    z.const('whisper'),
]);
export const SttConfig = z.object({
    enabled: z.boolean().default(true),
    engine: SttEngine.default('auto'),
    apiBase: z.string().default('https://api.openai.com/v1'),
    path: z.string().default('/audio/transcriptions'),
    credentialRef: z.string().role('credential-ref').default('OPENAI_API_KEY'),
    model: z.string().default('whisper-1'),
    language: z.string().default(''),
    timeoutMs: z.number().min(1).default(120000),
});
export const ReadAloudConfig = z.object({
    autoRead: z.boolean().default(false),
});
export const Config = z.object({
    tts: TtsConfig.default({
        enabled: true,
        provider: 'openai',
        apiBase: '',
        path: '',
        credentialRef: 'OPENAI_API_KEY',
        model: 'gpt-4o-mini-tts',
        voice: 'nova',
        speed: 1,
        format: 'mp3',
        instructions: '',
        timeoutMs: 60000,
    }),
    stt: SttConfig.default({
        enabled: true,
        engine: 'auto',
        apiBase: 'https://api.openai.com/v1',
        path: '/audio/transcriptions',
        credentialRef: 'OPENAI_API_KEY',
        model: 'whisper-1',
        language: '',
        timeoutMs: 120000,
    }),
    readAloud: ReadAloudConfig.default({ autoRead: false }),
});
