/**
 * Browser-facing HTTP routes mounted on the dsh `webServer`. The browser
 * never sees a credential: the TTS and STT routes proxy their upstreams
 * server-side, and the config route publishes only the non-secret slice the
 * client bundle needs (engine choices, voice list, current voice/speed).
 * @module dsh-voice/routes
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { type AccountsLike } from './speech.js';
import type { VoiceConfig } from './config.js';
/** The config getter the handlers read per request (settings-reload safe). */
export type ConfigSource = () => VoiceConfig;
/**
 * POST /voice/api/tts — synthesize `{text, voice?, speed?, format?}` through
 * the resolved provider and stream the upstream audio body straight back, so
 * playback starts as the first bytes land and keys never reach the client.
 * @param current - live voice-config source.
 * @param accounts - the account vault seam for credential resolution.
 * @returns The webServer route handler.
 */
export declare function makeTtsHandler(current: ConfigSource, accounts: AccountsLike | undefined): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
/**
 * POST /voice/api/stt — transcribe a raw recorded audio body through the
 * Whisper-compatible upstream. Used where the browser lacks SpeechRecognition
 * or the user picked the whisper engine.
 * @param current - live voice-config source.
 * @param accounts - the account vault seam for credential resolution.
 * @returns The webServer route handler.
 */
export declare function makeSttHandler(current: ConfigSource, accounts: AccountsLike | undefined): (req: IncomingMessage, res: ServerResponse) => Promise<void>;
/**
 * GET /voice/api/config — the non-secret slice the browser bundle composes
 * from: engine choices, auto-read, and the TTS voice picker data. Errors in
 * provider resolution surface as `providerError` so the settings UI can show
 * them instead of failing the page.
 * @param current - live voice-config source.
 * @returns The webServer route handler.
 */
export declare function makeConfigHandler(current: ConfigSource): (req: IncomingMessage, res: ServerResponse) => void;
