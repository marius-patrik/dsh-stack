/**
 * Speech upstream clients: credential resolution against the dsh account
 * vault, the neural TTS `/audio/speech` call (returned as a live stream), and
 * the Whisper-compatible `/audio/transcriptions` call. No credential is ever
 * stored by this plugin — every call resolves its key fresh from
 * `ctx.accounts` (vault first, harness credential seam second) with an
 * environment variable of the same reference name as the final fallback.
 * @module dsh-voice/speech
 */
import { authHeaders, joinUrl } from './providers.js';
/**
 * Reveal one credential: the account vault via `ctx.accounts`, then an
 * environment variable named exactly like the reference.
 * @param accounts - the account service (may be undefined in tests).
 * @param ref - canonical credential reference, e.g. `OPENAI_API_KEY`.
 * @returns The revealed value, or an empty string when unresolvable.
 */
export async function resolveCredential(accounts, ref) {
    if (ref.length === 0)
        return '';
    if (accounts !== undefined) {
        const hit = await accounts.resolve(ref);
        if (hit !== undefined && hit.value.length > 0)
            return hit.value;
    }
    return process.env[ref] ?? '';
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
export async function synthesizeSpeech(target, apiKey, text, overrides = {}) {
    const body = {
        model: target.model,
        input: text,
        voice: overrides.voice ?? target.voice,
        response_format: overrides.format ?? target.format,
    };
    const speed = overrides.speed ?? target.speed;
    if (target.provider.supportsSpeed && speed !== 1)
        body.speed = speed;
    if (target.instructions.length > 0)
        body.instructions = target.instructions;
    const res = await fetch(target.url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...authHeaders(target.provider.auth, apiKey),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(target.timeoutMs),
    });
    if (!res.ok) {
        const detail = await res.text();
        throw new Error(`speech upstream ${res.status}: ${detail.slice(0, 500)}`);
    }
    return res;
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
export async function transcribeAudio(settings, apiKey, audio, filename, languageHint) {
    const apiBase = settings.apiBase.replace(/\/+$/, '');
    if (apiBase.length === 0) {
        const err = new Error('Whisper STT is not configured: set voice.stt.apiBase (e.g. https://api.openai.com/v1, a gateway, or a local whisper.cpp server).');
        err.code = 'NOT_CONFIGURED';
        throw err;
    }
    const form = new FormData();
    form.append('file', new Blob([audio]), filename);
    form.append('model', settings.model);
    const language = languageHint || settings.language;
    if (language.length > 0)
        form.append('language', language);
    const res = await fetch(joinUrl(apiBase, settings.path || '/audio/transcriptions'), {
        method: 'POST',
        headers: authHeaders('bearer', apiKey),
        body: form,
        signal: AbortSignal.timeout(settings.timeoutMs),
    });
    if (!res.ok) {
        const detail = await res.text();
        throw new Error(`transcription upstream ${res.status}: ${detail.slice(0, 500)}`);
    }
    const data = (await res.json());
    return {
        text: typeof data.text === 'string' ? data.text : JSON.stringify(data),
        ...(typeof data.language === 'string' ? { language: data.language } : {}),
    };
}
