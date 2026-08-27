/**
 * A subscribable singleton around {@link reduceWorkspaceTabs}. The three
 * surfaces are separate React trees, so they need one shared authority to
 * render from rather than three private `useState` arrays kept in step by
 * broadcast events.
 *
 * @module @dsh-stack/workspace-tabs/create-workspace-tabs-store
 */
import { reduceWorkspaceTabs } from "./reduce-workspace-tabs.js";
import {
  type WorkspaceTabsAction,
  type WorkspaceTabsState,
  createWorkspaceTabsState,
} from "./workspace-tab.js";

/** The shared tab authority handed to every surface. */
export interface WorkspaceTabsStore {
  /** The current state. Stable identity while nothing changes. */
  getState(): WorkspaceTabsState;
  /** Applies one action and notifies subscribers when the state changed. */
  dispatch(action: WorkspaceTabsAction): WorkspaceTabsState;
  /** Registers a change listener; call the result to stop listening. */
  subscribe(listener: () => void): () => void;
}

/** Creates a store seeded with `initial`, or with the empty workspace state. */
export function createWorkspaceTabsStore(initial?: WorkspaceTabsState): WorkspaceTabsStore {
  let state = initial ?? createWorkspaceTabsState();
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    /** Applies one action, notifying subscribers only on a real change. */
    dispatch(action) {
      const next = reduceWorkspaceTabs(state, action);
      if (next === state) return state;
      state = next;
      for (const listener of [...listeners]) listener();
      return state;
    },
    /** Adds a change listener and returns its disposer. */
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
