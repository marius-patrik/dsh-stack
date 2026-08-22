/**
 * The per-session action controller: which action each session runs on, with
 * durable state folded from the session log. A selection made mid-turn stays
 * pending until the next accepted in-turn pre-step commits it and appends the
 * `action/selected` event; replay folds the log, so host restarts and cold
 * reads recover the active action from events alone.
 *
 * Compat: sessions logged before the dsh-session-modes → dsh-actions rename
 * carry `session-mode/selected` events with a `mode` field; the fold reads
 * both event names (and both payload fields) so those logs keep their state.
 * @module dsh-actions/controller
 */
/** The session-log event appended when a pending selection commits. */
export declare const ACTION_SELECTED = "action/selected";
/** The pre-rename event, still folded for existing session logs. */
export declare const LEGACY_MODE_SELECTED = "session-mode/selected";
/** One session's action state: the committed action plus a queued switch. */
export interface ActionState {
    active: string;
    pending?: string;
}
/**
 * Fold one session log into its committed action: the last `action/selected`
 * (or legacy `session-mode/selected`) whose id `valid` accepts, or
 * undefined when the log carries no usable selection.
 * @param events - the session's durable events.
 * @param valid - action-id validator (the catalog's known ids).
 */
export declare function foldAction(events: readonly {
    type?: string;
    data?: {
        action?: unknown;
        mode?: unknown;
    };
}[] | undefined, valid: (id: string) => boolean): string | undefined;
/**
 * The per-session action state machine. Reads fold the session log on first
 * touch (and cache by agent identity); writes queue a pending switch that
 * `commit()` settles at the next accepted step.
 */
export declare class ActionsController {
    private readonly defaultAction;
    private readonly valid;
    private readonly states;
    constructor(defaultAction: string, valid: (id: string) => boolean);
    /** The session's state: cached, else folded from its log, else the default. */
    get(agent: object): ActionState;
    /** Queue a switch: applies at the next accepted in-turn pre-step. */
    set(agent: object, action: string): 'queued' | 'noop';
    /** Settle a queued switch, returning the action now in force. */
    commit(agent: object): string;
}
/** @deprecated Compat alias for the pre-rename name; use {@link ActionsController}. */
export declare const ModesController: typeof ActionsController;
