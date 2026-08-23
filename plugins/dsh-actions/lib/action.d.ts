/**
 * Action files: the authoring input dsh-actions merges into the built-in
 * action vocabulary.
 *
 * An action file is either Markdown (optional `---` frontmatter with scalar
 * keys `name`, `description`, `provider`, `model`, and a comma-separated
 * `tools` allowlist; the body is the action's policy text) or JSON
 * (`{ name?, description?, tools?, provider?, model?, route?, policy }`). The
 * id is the file stem, sanitized to the action-id character set.
 *
 * A file whose id matches a built-in action OVERRIDES that built-in
 * (description, tools allowlist, route, and policy all come from the file);
 * any other id adds a custom action to the vocabulary.
 * @module dsh-actions/action
 */
/** One action's routing hint: the provider/model the session's requests use. */
export interface ActionRoute {
    provider: string;
    model: string;
}
/** A parsed action: one entry of the effective action vocabulary. */
export interface ActionSpec {
    /** Action id (the `/action` argument and the catalog key). */
    id: string;
    /** Display name; falls back to the id. */
    name?: string;
    /** One sentence on what this action is for. */
    description?: string;
    /** Tool allowlist; undefined means every tool is available. */
    tools?: readonly string[];
    /** Routing hint applied to the session's requests while the action is active. */
    route?: ActionRoute;
    /** The policy text rendered into the system prompt while the action is active. */
    policy: string;
    /** Absolute path of the authoring file; undefined for built-in actions. */
    source?: string;
}
/** The built-in action vocabulary (formerly the session modes). */
export declare const ACTIONS: readonly ["tool", "search", "action", "plan", "agent", "shell", "code"];
/** A built-in action id. */
export type BuiltInAction = (typeof ACTIONS)[number];
/** @deprecated Compat alias for the pre-rename name; use {@link ACTIONS}. */
export declare const MODES: readonly ["tool", "search", "action", "plan", "agent", "shell", "code"];
/** The default action a fresh session runs on. */
export declare const DEFAULT_ACTION: BuiltInAction;
/** The built-in actions, with their default policy texts. */
export declare const BUILT_IN_ACTIONS: readonly ActionSpec[];
/**
 * Sanitize a file stem into an action id: lowercase, map disallowed
 * characters to `-`, collapse runs, and guarantee a leading alphanumeric.
 * Unusable input (empty after cleanup) falls back to `action`.
 */
export declare function sanitizeId(stem: string): string;
/**
 * Parse one action file's text into an {@link ActionSpec}. A Markdown file's
 * body (after the frontmatter, or the whole file without one) is the policy
 * text; a JSON file's `policy` is. An empty policy is an error.
 * @param filePath - the authoring file path, used for the stem and extension.
 * @param content - the file text.
 * @throws when the file has no usable policy text.
 */
export declare function parseAction(filePath: string, content: string): ActionSpec;
