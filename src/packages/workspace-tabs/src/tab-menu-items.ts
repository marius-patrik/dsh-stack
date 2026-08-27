/**
 * The one place tab menus are derived. Every surface's tab context menu and
 * every surface's overflow ("...") menu come out of this function, which is why
 * the main area, the bottom panel and the secondary sidebar can no longer drift
 * apart in what they offer (issue #124).
 *
 * The result is data, not React: glyphs are named here and resolved by whoever
 * renders, so the derivation stays testable without a DOM.
 *
 * @module @dsh-stack/workspace-tabs/tab-menu-items
 */
import { TAB_SURFACE_PLACEMENTS } from "./tab-surface-placement.js";
import {
  type WorkspaceSurfaceId,
  type WorkspaceTab,
  type WorkspaceTabsState,
  WORKSPACE_SURFACE_IDS,
} from "./workspace-tab.js";

/** Named glyphs a menu row can carry; the renderer maps names to components. */
export type TabMenuGlyph = "main" | "bottom" | "secondary" | "close" | "collapse" | "expand";

/** One row of a tab menu. `id` is the action the surface dispatches on select. */
export interface TabMenuItem {
  readonly id: string;
  readonly label: string;
  readonly glyph: TabMenuGlyph;
  readonly danger?: boolean;
}

/** The action id that moves a tab to `surface`. */
export function moveActionId(surface: WorkspaceSurfaceId): string {
  return `move:${surface}`;
}

/** The surface named by a `move:` action id, or null for any other action. */
export function moveActionTarget(actionId: string): WorkspaceSurfaceId | null {
  const target = actionId.startsWith("move:") ? actionId.slice("move:".length) : null;
  return WORKSPACE_SURFACE_IDS.find((surface) => surface === target) ?? null;
}

/**
 * Rows for acting on one tab from the surface currently holding it: move it to
 * each other surface, close its siblings, close it.
 */
export function tabMenuItems(
  state: WorkspaceTabsState,
  tab: WorkspaceTab,
  host: WorkspaceSurfaceId,
): readonly TabMenuItem[] {
  const items: TabMenuItem[] = [];
  for (const surface of WORKSPACE_SURFACE_IDS) {
    if (surface === host) continue;
    items.push({
      id: moveActionId(surface),
      label: `Move to ${TAB_SURFACE_PLACEMENTS[surface].label}`,
      glyph: surface,
    });
  }
  if (state.order[host].length > 1) {
    items.push({ id: "close-others", label: "Close Other Tabs", glyph: "close" });
  }
  if (tab.closable !== false) {
    items.push({ id: "close", label: "Close Tab", glyph: "close", danger: true });
  }
  return items;
}

/**
 * Rows for a surface's overflow menu: the same tab actions for whatever tab is
 * active, plus the surface's own collapse toggle when it has one.
 */
export function surfaceMenuItems(
  state: WorkspaceTabsState,
  host: WorkspaceSurfaceId,
  collapsed: boolean,
): readonly TabMenuItem[] {
  const activeId = state.active[host];
  const activeTab = activeId ? state.tabs[activeId] : undefined;
  const items: TabMenuItem[] = activeTab ? [...tabMenuItems(state, activeTab, host)] : [];
  const placement = TAB_SURFACE_PLACEMENTS[host];
  if (placement.collapsible) {
    items.push({
      id: "collapse",
      label: `${collapsed ? "Expand" : "Collapse"} ${placement.label}`,
      glyph: collapsed ? "expand" : "collapse",
    });
  }
  return items;
}
