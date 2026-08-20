/**
 * Provider-agnostic TTS provider table and resolution. Each row describes one
 * OpenAI-compatible speech endpoint family — base URL, endpoint path, auth
 * style, advertised voices and models — so gateways and local servers work by
 * configuration alone (`provider: custom` + `apiBase`). Resolution merges a
 * table row with the user's `voice.tts` settings into one
 * {@link ResolvedTts} the speech client consumes.
 * @module dsh-voice/providers
 */
/** How the upstream expects its credential: HTTP auth style. */
export type AuthStyle = 'bearer' | 'api-key' | 'none';
/** One selectable voice advertised by a provider row. */
export interface VoiceInfo {
    id: string;
    label: string;
}
/** One row of the TTS provider table. */
export interface TtsProvider {
    /** Stable provider id referenced by `voice.tts.provider`. */
    id: string;
    /** Human name shown by configuration surfaces. */
    label: string;
    /** Default base URL; empty means the user MUST set `voice.tts.apiBase`. */
    baseURL: string;
    /** Speech endpoint path appended to the base URL. */
    path: string;
    /** HTTP auth style for the endpoint. */
    auth: AuthStyle;
    /** Default vault/env credential reference; `voice.tts.credentialRef` overrides. */
    credentialRef: string;
    /** Advertised models, best-sounding first (informational; any string saves). */
    models: string[];
    /** Advertised voices for the picker; empty means free-form. */
    voices: VoiceInfo[];
    /** Whether the endpoint honors the `speed` request field. */
    supportsSpeed: boolean;
    /** Whether the endpoint honors an `instructions` steering field. */
    supportsInstructions: boolean;
}
/** The built-in provider table. `custom` covers any OpenAI-compatible gateway. */
export declare const TTS_PROVIDERS: TtsProvider[];
/** The `voice.tts` settings slice resolution consumes. */
export interface TtsSettings {
    provider: string;
    apiBase: string;
    path: string;
    credentialRef: string;
    model: string;
    voice: string;
    speed: number;
    format: string;
    instructions: string;
    timeoutMs: number;
}
/** One fully resolved speech request target. */
export interface ResolvedTts {
    /** Provider row the settings resolved against. */
    provider: TtsProvider;
    /** Absolute endpoint URL (base + path, single slash). */
    url: string;
    /** Effective credential reference (config override wins over the row default). */
    credentialRef: string;
    model: string;
    voice: string;
    speed: number;
    format: string;
    /** Steering instructions, empty when unsupported or unset. */
    instructions: string;
    timeoutMs: number;
}
/**
 * Build the HTTP auth headers for one resolved credential.
 * @param auth - endpoint auth style.
 * @param key - revealed credential; may be empty for keyless endpoints.
 * @returns Header record to merge into the upstream request.
 */
export declare function authHeaders(auth: AuthStyle, key: string): Record<string, string>;
/** Join a base URL and an endpoint path with exactly one slash. */
export declare function joinUrl(base: string, path: string): string;
/**
 * Resolve the effective TTS target: provider row from the table, then user
 * overrides for base URL, path, credential reference, model, and voice.
 * @param settings - the resolved `voice.tts` settings slice.
 * @returns The fully resolved speech target.
 * @throws When the provider id is unknown, or the effective base URL is empty.
 */
export declare function resolveTts(settings: TtsSettings): ResolvedTts;
