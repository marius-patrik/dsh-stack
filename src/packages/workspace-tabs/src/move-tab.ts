import { clonePanes } from "./clone-panes.js";
import type { WorkspaceTabsState } from "./workspace-tabs-model.js";

/**
 * Relocate an open tab into `targetPaneId` as one atomic detach-then-insert.
 *
 * The tab is first removed from every pane that currently lists it and only then
 * inserted into the destination, so a move never raises the number of occupied
 * tab slots and a tab id can never appear in two panes at once. `index` is the
 * insertion position inside the destination list as it looks after the detach;
 * it is clamped into range, and omitting it appends. Moving within a single pane
 * therefore reorders that pane. Unknown tabs and unknown destination panes leave
 * the state untouched.
 */
export function moveTab(
  state: WorkspaceTabsState,
  tabId: string,
  targetPaneId: string,
  index?: number,
): WorkspaceTabsState {
  if (!state.tabs[tabId]) return state;
  if (!state.panes[targetPaneId]) return state;

  const panes = clonePanes(state.panes);
  for (const [id, pane] of Object.entries(panes)) {
    if (!pane.tabs.includes(tabId)) continue;
    const remaining = pane.tabs.filter((candidate) => candidate !== tabId);
    panes[id] = {
      ...pane,
      tabs: remaining,
      activeTabId: pane.activeTabId === tabId ? (remaining.at(-1) ?? null) : pane.activeTabId,
    };
  }

  const destination = panes[targetPaneId]!;
  const end = destination.tabs.length;
  const position =
    index === undefined || !Number.isFinite(index)
      ? end
      : Math.min(end, Math.max(0, Math.trunc(index)));
  const tabs = [...destination.tabs];
  tabs.splice(position, 0, tabId);
  panes[targetPaneId] = { ...destination, tabs, activeTabId: tabId };

  return { ...state, panes };
}
