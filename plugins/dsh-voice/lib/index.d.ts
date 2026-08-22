/**
 * dsh-voice — a natural, human-sounding voice for the dsh harness.
 *
 * Three layers:
 *
 *  1. Browser UI (client.js, hand-authored): a mic button on the composer
 *     (Web Speech API with interim results, falling back to server-proxied
 *     Whisper), a per-message read-aloud action playing neural TTS instead of
 *     the browser's speechSynthesis, and a "Voice" settings section.
 *  2. HTTP routes (routes.ts) on the dsh `webServer`: /voice/api/tts streams
 *     synthesized audio from an OpenAI-compatible speech endpoint so keys
 *     never reach the client; /voice/api/stt proxies Whisper transcriptions;
 *     /voice/api/config publishes the non-secret client slice.
 *  3. Agent tools (tools.ts): `voice_speak` and `voice_transcribe`, so the
 *     agent can speak with the same good voice and hear recordings.
 *
 * Credentials resolve per request from the dsh account vault via
 * `ctx.accounts` (dsh-credentials), referenced by name (`OPENAI_API_KEY` by
 * default) and never stored by this plugin. Providers are a table
 * (providers.ts): base URL, path, auth style, voices, models — any
 * OpenAI-compatible gateway works by configuration.
 * @module dsh-voice
 */
import type { Context } from '@deepseek-ai/cordis';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type VoiceConfig } from './config.js';
import type { AccountsLike } from './speech.js';
export { Config, VOICE_NS, type VoiceConfig } from './config.js';
export { TTS_PROVIDERS, authHeaders, joinUrl, resolveTts, type AuthStyle, type ResolvedTts, type TtsProvider, type VoiceInfo, } from './providers.js';
export { resolveCredential, synthesizeSpeech, transcribeAudio, type AccountsLike, type SttSettings, type Transcription, } from './speech.js';
export { makeConfigHandler, makeSttHandler, makeTtsHandler } from './routes.js';
export { registerVoiceTools } from './tools.js';
/** The webServer route shape this plugin registers (host-owned contract). */
interface WebRouteLike {
    kind: 'exact' | 'prefix';
    path: string;
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;
}
declare module '@deepseek-ai/cordis' {
    interface Context {
        /** The dsh host web server route registry. */
        webServer: {
            register(route: WebRouteLike): () => void;
        };
        /** The dsh-credentials account vault service. */
        accounts: AccountsLike;
    }
}
export declare const name = "dsh-voice";
export declare const inject: string[];
/**
 * Wire the plugin: install the `voice` settings section, mount the three
 * /voice/api routes, and register the agent tools. Every consumer reads the
 * live config source, so settings edits apply without a restart.
 * @param ctx - the plugin context carrying tools, settings, webServer, accounts.
 * @param config - the plugin's deployment configuration (settings base layer).
 */
export declare function apply(ctx: Context, config: VoiceConfig): void;
