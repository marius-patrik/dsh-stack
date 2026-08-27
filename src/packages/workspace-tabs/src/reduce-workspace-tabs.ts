/**
 * The single reducer every workspace surface goes through. Because all three
 * surfaces read one state, a move is one transition rather than a remove on the
 * source plus a hopeful broadcast to a destination that may not understand the
 * tab -- the shape that lost conversations (issue #122).
 *
 * @module @dsh-stack/workspace-tabs/reduce-workspace-tabs
 */
import {
  type WorkspaceSurfaceActive,
  type WorkspaceSurfaceId,
  type WorkspaceSurfaceOrder,
  type WorkspaceTab,
  type WorkspaceTabsAction,
  type WorkspaceTabsState,
  WORKSPACE_SURFACE_IDS,
  surfaceHolding,
} from "./workspace-tab.js";

/** Mutable working copies of the two per-surface maps, for one transition. */
interface SurfaceDraft {
  order: Record<WorkspaceSurfaceId, string[]>;
  active: Record<WorkspaceSurfaceId, string | null>;
}

/** Copies the per-surface maps so a transition never mutates the input state. */
function draftOf(state: WorkspaceTabsState): SurfaceDraft {
  return {
    order: {
      main: [...state.order.main],
      bottom: [...state.order.bottom],
      secondary: [...state.order.secondary],
    },
    active: { ...state.active },
  };
}

/** Freezes a draft plus a tab table back into a state value. */
function sealed(tabs: Record<string, WorkspaceTab>, draft: SurfaceDraft): WorkspaceTabsState {
  return {
    tabs,
    order: draft.order as WorkspaceSurfaceOrder,
    active: draft.active as WorkspaceSurfaceActive,
  };
}

/**
 * Drops `tabId` from every surface list, moving each surface's selection to the
 * neighbour that took its slot. Used by both close and move, so a tab can never
 * linger in a second surface's list.
 */
function detach(draft: SurfaceDraft, tabId: string): void {
  for (const surface of WORKSPACE_SURFACE_IDS) {
    const list = draft.order[surface];
    const index = list.indexOf(tabId);
    if (index === -1) continue;
    list.splice(index, 1);
    if (draft.active[surface] !== tabId) continue;
    const neighbour = list[Math.min(index, list.length - 1)];
    draft.active[surface] = neighbour ?? null;
  }
}

/** Appends `tabId` to one surface and selects it there. */
function attach(draft: SurfaceDraft, tabId: string, surface: WorkspaceSurfaceId): void {
  if (!draft.order[surface].includes(tabId)) draft.order[surface].push(tabId);
  draft.active[surface] = tabId;
}

/**
 * Applies one action.
 *
 * Unknown-tab actions are idempotent no-ops except `move`, which throws: a
 * transfer that cannot name its subject must fail loudly rather than commit a
 * removal that no destination will ever balance.
 */
export function reduceWorkspaceTabs(
  state: WorkspaceTabsState,
  action: WorkspaceTabsAction,
): WorkspaceTabsState {
  switch (action.type) {
    case "open": {
      const draft = draftOf(state);
      detach(draft, action.tab.id);
      attach(draft, action.tab.id, action.surface);
      return sealed({ ...state.tabs, [action.tab.id]: action.tab }, draft);
    }
    case "close": {
      if (!state.tabs[action.tabId]) return state;
      const draft = draftOf(state);
      detach(draft, action.tabId);
      const tabs = { ...state.tabs };
      delete tabs[action.tabId];
      return sealed(tabs, draft);
    }
    case "close-others": {
      const host = surfaceHolding(state, action.tabId);
      if (!host) return state;
      let next = state;
      for (const other of state.order[host]) {
        if (other !== action.tabId)
          next = reduceWorkspaceTabs(next, { type: "close", tabId: other });
      }
      return next;
    }
    case "activate": {
      const host = surfaceHolding(state, action.tabId);
      if (!host || state.active[host] === action.tabId) return state;
      const draft = draftOf(state);
      draft.active[host] = action.tabId;
      return sealed({ ...state.tabs }, draft);
    }
    case "retitle": {
      const tab = state.tabs[action.tabId];
      if (!tab || tab.title === action.title) return state;
      const tabs = { ...state.tabs, [action.tabId]: { ...tab, title: action.title } };
      return sealed(tabs, draftOf(state));
    }
    case "move": {
      const tab = state.tabs[action.tabId];
      if (!tab) {
        throw new Error(
          `Cannot move unknown workspace tab "${action.tabId}" to ${action.surface}: ` +
            "no surface owns it, so committing the move would destroy it.",
        );
      }
      if (surfaceHolding(state, action.tabId) === action.surface) {
        return reduceWorkspaceTabs(state, { type: "activate", tabId: action.tabId });
      }
      const draft = draftOf(state);
      detach(draft, action.tabId);
      attach(draft, action.tabId, action.surface);
      return sealed({ ...state.tabs }, draft);
    }
  }
}
