/**
 * Agent-facing tools: `voice_speak` renders text through the same neural TTS
 * the browser read-aloud uses and writes the audio into the workspace, and
 * `voice_transcribe` turns an audio file into text through the
 * Whisper-compatible upstream. Both resolve credentials per call from the
 * account vault, so the model never sees a key.
 * @module dsh-voice/tools
 */
import { type AccountsLike } from './speech.js';
import type { VoiceConfig } from './config.js';
/** The tool registry slice of the plugin context. */
export interface ToolRegistry {
    register(definition: unknown): () => void;
}
/**
 * Register both voice tools against the harness tool registry.
 * @param tools - the harness tool registry (`ctx.tools`).
 * @param current - live voice-config source.
 * @param accounts - the account vault seam for credential resolution.
 * @returns Nothing; registrations ride the caller's fiber.
 */
export declare function registerVoiceTools(tools: ToolRegistry, current: () => VoiceConfig, accounts: AccountsLike | undefined): void;
