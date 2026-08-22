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
export const ACTION_SELECTED = 'action/selected';
/** The pre-rename event, still folded for existing session logs. */
export const LEGACY_MODE_SELECTED = 'session-mode/selected';
/**
 * Fold one session log into its committed action: the last `action/selected`
 * (or legacy `session-mode/selected`) whose id `valid` accepts, or
 * undefined when the log carries no usable selection.
 * @param events - the session's durable events.
 * @param valid - action-id validator (the catalog's known ids).
 */
export function foldAction(events, valid) {
    const event = events?.findLast((entry) => (entry.type === ACTION_SELECTED || entry.type === LEGACY_MODE_SELECTED)
        && typeof (entry.data?.action ?? entry.data?.mode) === 'string'
        && valid((entry.data?.action ?? entry.data?.mode)));
    const selected = event?.data?.action ?? event?.data?.mode;
    return typeof selected === 'string' && valid(selected) ? selected : undefined;
}
/**
 * The per-session action state machine. Reads fold the session log on first
 * touch (and cache by agent identity); writes queue a pending switch that
 * `commit()` settles at the next accepted step.
 */
export class ActionsController {
    defaultAction;
    valid;
    states = new WeakMap();
    constructor(defaultAction, valid) {
        this.defaultAction = defaultAction;
        this.valid = valid;
    }
    /** The session's state: cached, else folded from its log, else the default. */
    get(agent) {
        const state = this.states.get(agent);
        if (state !== undefined)
            return { ...state };
        const restored = foldAction(agent.session?.events, this.valid);
        if (restored !== undefined) {
            this.states.set(agent, { active: restored });
            return { active: restored };
        }
        return { active: this.defaultAction };
    }
    /** Queue a switch: applies at the next accepted in-turn pre-step. */
    set(agent, action) {
        const current = this.get(agent);
        if (current.active === action && current.pending === undefined)
            return 'noop';
        this.states.set(agent, { active: current.active, pending: action });
        return 'queued';
    }
    /** Settle a queued switch, returning the action now in force. */
    commit(agent) {
        const current = this.get(agent);
        if (current.pending === undefined)
            return current.active;
        this.states.set(agent, { active: current.pending });
        return current.pending;
    }
}
/** @deprecated Compat alias for the pre-rename name; use {@link ActionsController}. */
export const ModesController = ActionsController;
