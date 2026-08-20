/**
 * Speech upstream clients: credential resolution against the dsh account
 * vault, the neural TTS `/audio/speech` call (returned as a live stream), and
 * the Whisper-compatible `/audio/transcriptions` call. No credential is ever
 * stored by this plugin — every call resolves its key fresh from
 * `ctx.accounts` (vault first, harness credential seam second) with an
 * environment variable of the same reference name as the final fallback.
 * @module dsh-voice/speech
 */
import { type ResolvedTts } from './providers.js';
/** The slice of the dsh-credentials account service this plugin consumes. */
export interface AccountsLike {
    /** Resolve a canonical reference, vault first; undefined when absent. */
    resolve(ref: string): Promise<{
        value: string;
        origin: string;
    } | undefined>;
}
/**
 * Reveal one credential: the account vault via `ctx.accounts`, then an
 * environment variable named exactly like the reference.
 * @param accounts - the account service (may be undefined in tests).
 * @param ref - canonical credential reference, e.g. `OPENAI_API_KEY`.
 * @returns The revealed value, or an empty string when unresolvable.
 */
export declare function resolveCredential(accounts: AccountsLike | undefined, ref: string): Promise<string>;
/** Overrides one speech request may apply over the resolved settings. */
export interface SpeechOverrides {
    voice?: string;
    speed?: number;
    format?: string;
}
/**
 * Call the OpenAI-compatible speech endpoint and return the raw streaming
 * response. The caller owns forwarding or buffering the audio body.
 * @param target - resolved TTS target.
 * @param apiKey - revealed credential (empty for keyless endpoints).
 * @param text - text to synthesize.
 * @param overrides - per-request voice/speed/format overrides.
 * @returns The upstream response; `response.body` is the live audio stream.
 * @throws On any non-2xx upstream status, with the upstream detail.
 */
export declare function synthesizeSpeech(target: ResolvedTts, apiKey: string, text: string, overrides?: SpeechOverrides): Promise<Response>;
/** The `voice.stt` settings slice the transcription client consumes. */
export interface SttSettings {
    apiBase: string;
    path: string;
    credentialRef: string;
    model: string;
    language: string;
    timeoutMs: number;
}
/** One completed transcription. */
export interface Transcription {
    text: string;
    language?: string;
}
/**
 * Send raw audio bytes to a Whisper-compatible `/audio/transcriptions`
 * endpoint.
 * @param settings - the resolved `voice.stt` settings slice.
 * @param apiKey - revealed credential (empty for keyless endpoints).
 * @param audio - encoded audio bytes (webm/mp3/wav/m4a/ogg/flac).
 * @param filename - upload filename carrying the container extension.
 * @param languageHint - ISO-639-1 hint overriding the configured language.
 * @returns The transcribed text and the detected/used language when reported.
 * @throws `NOT_CONFIGURED` when no base URL is set; otherwise upstream errors.
 */
export declare function transcribeAudio(settings: SttSettings, apiKey: string, audio: Uint8Array, filename: string, languageHint: string): Promise<Transcription>;
