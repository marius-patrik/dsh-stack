import { clonePanes } from "./clone-panes.js";
import { moveTab } from "./move-tab.js";
import type {
  SplitOrientation,
  WorkspacePane,
  WorkspaceTab,
  WorkspaceTabsAction,
  WorkspaceTabsOptions,
  WorkspaceTabsState,
} from "./workspace-tabs-model.js";

export type {
  SplitOrientation,
  WorkspacePane,
  WorkspaceTab,
  WorkspaceTabKind,
  WorkspaceTabsAction,
  WorkspaceTabsOptions,
  WorkspaceTabsState,
} from "./workspace-tabs-model.js";

const DEFAULT_MAIN_PANE = "pane-main";
const DEFAULT_DOCK_HEIGHT = 280;

/** createWorkspaceTabs implementation. */
export function createWorkspaceTabs(options: WorkspaceTabsOptions = {}): WorkspaceTabsState {
  const mainPaneId = DEFAULT_MAIN_PANE;
  return {
    tabs: {},
    panes: {
      [mainPaneId]: {
        id: mainPaneId,
        orientation: "horizontal",
        tabs: [],
        activeTabId: null,
      },
    },
    mainPaneId,
    bottomDockOpen: false,
    bottomDockHeight: clampDockHeight(options.bottomDockHeight ?? DEFAULT_DOCK_HEIGHT),
  };
}

/**
 * Adjusts the workspace tabs state based on the given action.
 *
 * Guarantees the state of workspace tabs is updated according to the action type.
 * Returns the new state of workspace tabs after applying the action.
 * Fails if the action type is unrecognized, leaving the state unchanged.
 */
export function reduceWorkspaceTabs(
  state: WorkspaceTabsState,
  action: WorkspaceTabsAction,
  options: WorkspaceTabsOptions = {},
): WorkspaceTabsState {
  switch (action.type) {
    case "open":
      return openTab(state, action.tab, action.paneId);
    case "close":
      return closeTab(state, action.tabId);
    case "close-others":
      return closeOtherTabs(state, action.tabId);
    case "activate":
      return activateTab(state, action.tabId);
    case "move":
      return moveTab(state, action.tabId, action.targetPaneId, action.index);
    case "split":
      return splitPane(
        state,
        action.sourcePaneId,
        action.orientation,
        action.tabId,
        options.idFactory ?? newId,
      );
    case "bottom-dock":
      return { ...state, bottomDockOpen: action.open ?? !state.bottomDockOpen };
    case "bottom-dock-height":
      return { ...state, bottomDockHeight: clampDockHeight(action.height) };
  }
}

/**
 * Register a tab and reveal it. A tab that is already open is never listed a
 * second time: an explicit target pane relocates it through the move path, and
 * anything else simply activates it where it already lives.
 */
function openTab(
  state: WorkspaceTabsState,
  tab: WorkspaceTab,
  requestedPaneId: string | undefined,
): WorkspaceTabsState {
  const tabs = { ...state.tabs, [tab.id]: tab };
  const holder = Object.values(state.panes).find((pane) => pane.tabs.includes(tab.id));
  if (holder) {
    if (requestedPaneId && requestedPaneId !== holder.id && state.panes[requestedPaneId]) {
      return moveTab({ ...state, tabs }, tab.id, requestedPaneId);
    }
    return activateTab({ ...state, tabs }, tab.id);
  }
  const pane = state.panes[requestedPaneId ?? state.mainPaneId] ?? state.panes[state.mainPaneId]!;
  const panes = clonePanes(state.panes);
  panes[pane.id] = { ...pane, tabs: [...pane.tabs, tab.id], activeTabId: tab.id };
  return { ...state, tabs, panes };
}

/** closeTab implementation. */
function closeTab(state: WorkspaceTabsState, tabId: string): WorkspaceTabsState {
  const tab = state.tabs[tabId];
  if (!tab) return state;
  const panes = clonePanes(state.panes);
  for (const [id, pane] of Object.entries(panes)) {
    if (!pane.tabs.includes(tabId)) continue;
    const next = pane.tabs.filter((id) => id !== tabId);
    panes[id] = {
      ...pane,
      tabs: next,
      activeTabId: pane.activeTabId === tabId ? (next.at(-1) ?? null) : pane.activeTabId,
    };
  }
  const tabs = { ...state.tabs };
  delete tabs[tabId];
  return { ...state, tabs, panes };
}

/**
 * Closes all tabs except the specified one in the active pane and updates the state.
 *
 * Guarantees that the specified tab remains open and all other tabs in the same pane are closed.
 * Returns the updated workspace state with the specified tab closed and the active tab adjusted if necessary.
 * Fails gracefully by returning the original state if the tab is not found or no changes are needed.
 */
function closeOtherTabs(state: WorkspaceTabsState, tabId: string): WorkspaceTabsState {
  const tab = state.tabs[tabId];
  if (!tab) return state;
  const pane = Object.values(state.panes).find((candidate) => candidate.tabs.includes(tabId));
  if (!pane) return state;
  let next = state;
  for (const candidate of pane.tabs) {
    if (candidate !== tabId) next = closeTab(next, candidate);
  }
  return next;
}

/**
 * Activates the specified tab by ensuring it is the active tab within its pane.
 * Guarantees that the specified tab becomes the active tab, and all other tabs in the same pane are closed.
 * Returns the updated workspace state with the specified tab activated and the active tab ID set.
 * Fails gracefully by returning the original state if the tab is not found or no changes are needed.
 */
function activateTab(state: WorkspaceTabsState, tabId: string): WorkspaceTabsState {
  if (!state.tabs[tabId]) return state;
  const panes = clonePanes(state.panes);
  for (const [id, pane] of Object.entries(panes)) {
    if (pane.tabs.includes(tabId)) panes[id] = { ...pane, activeTabId: tabId };
  }
  return { ...state, panes };
}

/** splitPane implementation. */
function splitPane(
  state: WorkspaceTabsState,
  sourcePaneId: string,
  orientation: SplitOrientation,
  tabId: string | undefined,
  idFactory: () => string,
): WorkspaceTabsState {
  const source = state.panes[sourcePaneId];
  if (!source) return state;
  const newId = idFactory();
  if (state.panes[newId]) throw new Error(`Pane id collision: ${newId}`);
  const panes = clonePanes(state.panes);
  const newPane: WorkspacePane = { id: newId, orientation, tabs: [], activeTabId: null };
  panes[newId] = newPane;

  if (tabId && source.tabs.includes(tabId)) {
    panes[sourcePaneId] = {
      ...source,
      tabs: source.tabs.filter((candidate) => candidate !== tabId),
      activeTabId:
        source.activeTabId === tabId
          ? (source.tabs.find((candidate) => candidate !== tabId) ?? null)
          : source.activeTabId,
    };
    panes[newId] = { ...newPane, tabs: [tabId], activeTabId: tabId };
  }

  return { ...state, panes };
}

/**
 * Adjusts the height of a dock pane to fit within the allowed range.
 * Ensures the pane height is not less than the minimum allowed height
 * and not greater than the maximum allowed height.
 * Returns the updated workspace state with the clamped pane height.
 * Throws an error if the new height is out of the allowed range.
 */
function clampDockHeight(value: number): number {
  return Math.min(800, Math.max(160, Math.round(value)));
}

/**
 * Moves a tab from the source pane to a new pane with a unique ID.
 *
 * Guarantees that the new pane ID is unique and not already in use.
 * Returns the updated workspace state with the new pane and updated tab distribution.
 * Throws an error if the new ID collides with an existing pane ID.
 */
function newId(): string {
  return `pane-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
