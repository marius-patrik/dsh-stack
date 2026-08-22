/**
 * `dsh-translator`: translates between provider-native session, skill, and hook
 * file formats and the dsh-stack optimized format.
 *
 * Supported formats:
 * - opencode: messages[] with role/content structure
 * - claude: entries[] with type/text structure
 * - dsh: events[] with type/seq/data structure (native harness format)
 *
 * The translator can convert any supported format to any other, and can batch
 * convert entire session directories.
 *
 * @module dsh-translator
 */
export const name = 'dsh-translator';
export const inject = [];
/* -------------------------------------------------------------------------- */
/* Format detection                                                             */
/* -------------------------------------------------------------------------- */
export function detectFormat(data) {
    if (data === null || typeof data !== 'object')
        return null;
    const obj = data;
    if ('messages' in obj && Array.isArray(obj.messages))
        return 'opencode';
    if ('entries' in obj && Array.isArray(obj.entries))
        return 'claude';
    if ('events' in obj && Array.isArray(obj.events))
        return 'dsh';
    return null;
}
export class TranslatorRegistry {
    converters = new Map();
    register(sourceFormat, targetFormat, fn) {
        this.converters.set(`${sourceFormat}->${targetFormat}`, fn);
    }
    translate(data, sourceFormat, targetFormat) {
        if (sourceFormat === targetFormat)
            return data;
        const key = `${sourceFormat}->${targetFormat}`;
        const fn = this.converters.get(key);
        if (fn === undefined)
            throw new Error(`no converter for ${sourceFormat} -> ${targetFormat}`);
        return fn(data);
    }
    supportedConversions() {
        return [...this.converters.keys()];
    }
}
/* -------------------------------------------------------------------------- */
/* Built-in converters                                                          */
/* -------------------------------------------------------------------------- */
function opencodeToDsh(data) {
    const input = data;
    let seq = 0;
    return {
        events: input.messages.map((msg) => ({
            type: msg.role === 'user' ? 'user/message' : msg.role === 'assistant' ? 'assistant/message' : 'system/message',
            seq: seq++,
            role: msg.role,
            content: typeof msg.content === 'string'
                ? [{ type: 'text', text: msg.content }]
                : msg.content,
            timestamp: msg.timestamp,
        })),
    };
}
function dshToOpencode(data) {
    const input = data;
    return {
        messages: input.events
            .filter((e) => e.type.includes('/message'))
            .map((e) => ({
            role: e.role ?? (e.type.startsWith('user/') ? 'user' : 'assistant'),
            content: e.content ?? [],
            timestamp: e.timestamp,
        })),
    };
}
function claudeToDsh(data) {
    const input = data;
    let seq = 0;
    return {
        events: input.entries.map((entry) => ({
            type: entry.type === 'human' ? 'user/message' : entry.type === 'assistant' ? 'assistant/message' : entry.type,
            seq: seq++,
            role: entry.type === 'human' ? 'user' : entry.type === 'assistant' ? 'assistant' : undefined,
            content: [{ type: 'text', text: entry.text ?? entry.content ?? '' }],
        })),
    };
}
function dshToClaude(data) {
    const input = data;
    return {
        entries: input.events
            .filter((e) => e.type.includes('/message'))
            .map((e) => ({
            type: e.role === 'user' ? 'human' : 'assistant',
            text: e.content?.map((c) => c.text ?? '').join('') ?? '',
        })),
    };
}
export function apply(ctx, _config = {}) {
    const registry = new TranslatorRegistry();
    // Register built-in converters
    registry.register('opencode', 'dsh', opencodeToDsh);
    registry.register('dsh', 'opencode', dshToOpencode);
    registry.register('claude', 'dsh', claudeToDsh);
    registry.register('dsh', 'claude', dshToClaude);
    // Cross-format via dsh as pivot
    registry.register('opencode', 'claude', (data) => {
        const dsh = opencodeToDsh(data);
        return dshToClaude(dsh);
    });
    registry.register('claude', 'opencode', (data) => {
        const dsh = claudeToDsh(data);
        return dshToOpencode(dsh);
    });
    ctx.provide('translators', registry);
    ctx.logger.info(`dsh-translator loaded: ${registry.supportedConversions().length} converters registered`);
}
