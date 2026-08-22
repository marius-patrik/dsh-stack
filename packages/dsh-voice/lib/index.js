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
import { installSettingsSection } from '@deepseek-ai/dsh-settings';
import { Config, VOICE_NS } from './config.js';
import { makeConfigHandler, makeSttHandler, makeTtsHandler } from './routes.js';
import { registerVoiceTools } from './tools.js';
export { Config, VOICE_NS } from './config.js';
export { TTS_PROVIDERS, authHeaders, joinUrl, resolveTts, } from './providers.js';
export { resolveCredential, synthesizeSpeech, transcribeAudio, } from './speech.js';
export { makeConfigHandler, makeSttHandler, makeTtsHandler } from './routes.js';
export { registerVoiceTools } from './tools.js';
export const name = 'dsh-voice';
export const inject = ['tools', 'settings', 'webServer', 'accounts'];
/**
 * Wire the plugin: install the `voice` settings section, mount the three
 * /voice/api routes, and register the agent tools. Every consumer reads the
 * live config source, so settings edits apply without a restart.
 * @param ctx - the plugin context carrying tools, settings, webServer, accounts.
 * @param config - the plugin's deployment configuration (settings base layer).
 */
export function apply(ctx, config) {
    let current = () => config;
    installSettingsSection(ctx, VOICE_NS, Config, config, {
        setSource: (source) => {
            current = source;
        },
        onChange: () => { },
    });
    const accounts = ctx.accounts;
    ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: '/voice/api/tts',
        handler: makeTtsHandler(() => current(), accounts),
    }), 'dsh-voice: /voice/api/tts route');
    ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: '/voice/api/stt',
        handler: makeSttHandler(() => current(), accounts),
    }), 'dsh-voice: /voice/api/stt route');
    ctx.effect(() => ctx.webServer.register({
        kind: 'exact',
        path: '/voice/api/config',
        handler: makeConfigHandler(() => current()),
    }), 'dsh-voice: /voice/api/config route');
    registerVoiceTools(ctx.tools, () => current(), accounts);
    ctx.logger('[dsh-voice]').info('mounted /voice/api/{tts,stt,config} + voice_speak + voice_transcribe');
}
