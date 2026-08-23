/**
 * The `voice` settings namespace schema. This plugin consumes and extends the
 * harness' existing `voice` seam (the namespace the voice tooling already
 * registers), keeping the established `stt` keys and adding the neural-TTS
 * `tts` table and the `readAloud` section. Credentials are references into
 * the dsh account vault (`credentialRef`), never stored values.
 * @module dsh-voice/config
 */
import z from '@deepseek-ai/schemastery';
/** The settings namespace this plugin owns. */
export declare const VOICE_NS: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Neural text-to-speech settings. */
export interface TtsConfig {
    enabled: boolean;
    /** Provider-table row id; `custom` covers any OpenAI-compatible gateway. */
    provider: string;
    /** Base URL override (required for `custom`; e.g. a gateway or local server). */
    apiBase: string;
    /** Speech endpoint path; empty inherits the provider row. */
    path: string;
    /** Account-vault credential reference resolved per request. */
    credentialRef: string;
    /** Natural-voice model, e.g. gpt-4o-mini-tts or tts-1-hd. */
    model: string;
    voice: string;
    speed: number;
    format: string;
    /** Steering instructions for models that accept them (gpt-4o-mini-tts). */
    instructions: string;
    timeoutMs: number;
}
export declare const TtsConfig: z<TtsConfig>;
/** Speech-to-text engine selection for the composer mic button. */
export type SttEngine = 'auto' | 'browser' | 'whisper';
export declare const SttEngine: z<SttEngine>;
/** Speech-to-text settings: the composer mic and the voice_transcribe tool. */
export interface SttConfig {
    enabled: boolean;
    /**
     * `browser` uses the Web Speech API with interim results, `whisper`
     * records and posts to the server-proxied /voice/api/stt route, and
     * `auto` prefers the browser and falls back to Whisper where the browser
     * lacks SpeechRecognition.
     */
    engine: SttEngine;
    /** Whisper-compatible base URL for the /voice/api/stt route. */
    apiBase: string;
    /** Transcriptions endpoint path. */
    path: string;
    credentialRef: string;
    model: string;
    /** ISO-639-1 hint (zh / en / …); empty = auto-detect. */
    language: string;
    timeoutMs: number;
}
export declare const SttConfig: z<SttConfig>;
/** Read-aloud behavior settings. */
export interface ReadAloudConfig {
    /** Automatically read each new assistant reply aloud once it settles. */
    autoRead: boolean;
}
export declare const ReadAloudConfig: z<ReadAloudConfig>;
/** The validated `voice` settings section. */
export interface VoiceConfig {
    tts: TtsConfig;
    stt: SttConfig;
    readAloud: ReadAloudConfig;
}
export declare const Config: z<VoiceConfig>;
