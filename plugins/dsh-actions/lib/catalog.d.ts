/**
 * The runtime action catalog: id → action, re-indexed from the authoring
 * root at boot and whenever the authoring directory changes. The built-in
 * actions are always present; a file that parses ADDs a custom action or
 * OVERRIDES a built-in of the same id. The prompt section, command
 * validation, and tool/route policies read the catalog synchronously, so it
 * is an in-memory index, not a per-read filesystem walk.
 * @module dsh-actions/catalog
 */
import { type ActionSpec } from './action.js';
/** The catalog's authoring directory, as resolved by the caller. */
export interface ActionCatalogConfig {
    root: string;
}
/**
 * The runtime action index over the built-ins plus the authoring files.
 * `load()` replaces the file-defined half wholesale; a file that fails to
 * parse (or disappears) simply stops contributing, and its built-in (when
 * the id matches one) stands again.
 */
export declare class ActionCatalog {
    private readonly config;
    private readonly fileActions;
    constructor(config: ActionCatalogConfig);
    /** Re-index the authoring root. Never throws; unreadable files are skipped. */
    load(): Promise<void>;
    /** The action with the given id: the file definition wins over the built-in. */
    get(actionId: string): ActionSpec | undefined;
    /** Display name for an action id (falls back to the id). */
    nameOf(actionId: string): string;
    /** The known action ids (built-ins plus file-defined), for validation. */
    ids(): readonly string[];
    /** The effective vocabulary: every built-in (or its file override), then
     * custom file-defined actions, sorted by id within each half. */
    list(): readonly ActionSpec[];
}
