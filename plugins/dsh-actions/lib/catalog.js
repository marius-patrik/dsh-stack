/**
 * The runtime action catalog: id → action, re-indexed from the authoring
 * root at boot and whenever the authoring directory changes. The built-in
 * actions are always present; a file that parses ADDs a custom action or
 * OVERRIDES a built-in of the same id. The prompt section, command
 * validation, and tool/route policies read the catalog synchronously, so it
 * is an in-memory index, not a per-read filesystem walk.
 * @module dsh-actions/catalog
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { BUILT_IN_ACTIONS, parseAction } from './action.js';
/** The authoring file extensions the catalog indexes. */
const ACTION_EXTENSIONS = new Set(['.md', '.json']);
/**
 * The runtime action index over the built-ins plus the authoring files.
 * `load()` replaces the file-defined half wholesale; a file that fails to
 * parse (or disappears) simply stops contributing, and its built-in (when
 * the id matches one) stands again.
 */
export class ActionCatalog {
    config;
    fileActions = new Map();
    constructor(config) {
        this.config = config;
    }
    /** Re-index the authoring root. Never throws; unreadable files are skipped. */
    async load() {
        this.fileActions.clear();
        let names;
        try {
            names = await readdir(this.config.root);
        }
        catch {
            return;
        }
        for (const name of names) {
            const extension = extensionOf(name);
            if (extension === undefined)
                continue;
            const source = join(this.config.root, name);
            try {
                const action = parseAction(source, await readFile(source, 'utf8'));
                this.fileActions.set(action.id, action);
            }
            catch {
                // Unparsable files are skipped; the built-in vocabulary still stands.
            }
        }
    }
    /** The action with the given id: the file definition wins over the built-in. */
    get(actionId) {
        return this.fileActions.get(actionId) ?? BUILT_IN_ACTIONS.find((action) => action.id === actionId);
    }
    /** Display name for an action id (falls back to the id). */
    nameOf(actionId) {
        return this.get(actionId)?.name ?? actionId;
    }
    /** The known action ids (built-ins plus file-defined), for validation. */
    ids() {
        return this.list().map((action) => action.id);
    }
    /** The effective vocabulary: every built-in (or its file override), then
     * custom file-defined actions, sorted by id within each half. */
    list() {
        const builtIns = BUILT_IN_ACTIONS.map((builtIn) => this.fileActions.get(builtIn.id) ?? builtIn);
        const customs = [...this.fileActions.values()]
            .filter((action) => !BUILT_IN_ACTIONS.some((builtIn) => builtIn.id === action.id))
            .sort((left, right) => left.id.localeCompare(right.id));
        return [...builtIns, ...customs];
    }
}
/** The normalized extension of an action file, or undefined for other files. */
function extensionOf(name) {
    const dot = name.lastIndexOf('.');
    if (dot < 0)
        return undefined;
    const extension = name.slice(dot).toLowerCase();
    return ACTION_EXTENSIONS.has(extension) ? extension : undefined;
}
