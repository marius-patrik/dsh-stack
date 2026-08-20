/**
 * `dsh-actions`: explicit per-session actions (formerly session modes) with
 * durable state, executor policy, request routing, a file-defined vocabulary
 * under `.agents/actions`, and the reload actions (soft client reload and the
 * hard server self-restart).
 * @module dsh-actions
 */
import type { Context } from '@deepseek-ai/cordis';
import { type ActionRoute } from './action.js';
import { ActionsController } from './controller.js';
export { ACTIONS, BUILT_IN_ACTIONS, DEFAULT_ACTION, MODES, parseAction, sanitizeId } from './action.js';
export type { ActionRoute, ActionSpec, BuiltInAction } from './action.js';
export { ActionCatalog } from './catalog.js';
export type { ActionCatalogConfig } from './catalog.js';
export { ACTION_SELECTED, LEGACY_MODE_SELECTED, ActionsController, ModesController, foldAction } from './controller.js';
export type { ActionState } from './controller.js';
export * from './reload.js';
export declare const name = "dsh-actions";
export declare const inject: string[];
declare module '@deepseek-ai/cordis' {
    interface Context {
        actions: ActionsController;
        /** @deprecated compat alias for the pre-rename service name. */
        sessionModes: ActionsController;
    }
}
/** @deprecated compat alias for the pre-rename type name. */
export type SessionMode = string;
export interface Config {
    /** The action a fresh session runs on. */
    defaultAction?: string;
    /** @deprecated compat alias for {@link Config.defaultAction}. */
    defaultMode?: string;
    /** Per-action provider/model routing. */
    routes?: Record<string, ActionRoute>;
    /** Per-action tool allowlists. */
    tools?: Record<string, readonly string[]>;
    /** The authoring root for file-defined actions (default: <DSH_HOME>/actions). */
    actionsRoot?: string;
}
export declare function apply(ctx: Context, config?: Config): void;
