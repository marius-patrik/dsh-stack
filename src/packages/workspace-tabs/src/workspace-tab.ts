/**
 * The tab vocabulary every workspace surface shares: what a tab is, which
 * surface can host it, and the shape of the state the surfaces render from.
 *
 * There is one model for all three surfaces on purpose. The main area, the
 * bottom panel and the secondary sidebar previously each kept their own array
 * of tabs and reconciled them by broadcasting `CustomEvent`s at each other,
 * which is how a moved tab could end up owned by nobody.
 *
 * @module @dsh-stack/workspace-tabs/workspace-tab
 */

/** The surfaces that can host tabs. They differ only in where they are drawn. */
export type WorkspaceSurfaceId = "main" | "bottom" | "secondary";

/** Every surface id, in the order the move menus offer them. */
export const WORKSPACE_SURFACE_IDS: readonly WorkspaceSurfaceId[] = ["main", "bottom", "secondary"];

/** The kinds of content a tab can carry. Any kind is hostable on any surface. */
export type WorkspaceTabKind = "chat" | "file" | "repo" | "diff" | "terminal" | "container";

/** One open tab. `id` is unique across every surface, not per surface. */
export interface WorkspaceTab {
  readonly id: string;
  readonly kind: WorkspaceTabKind;
  readonly title: string;
  /** tmux session name, for `terminal` tabs. */
  readonly session?: string;
  /** filesystem path, for `file`, `repo` and `diff` tabs. */
  readonly path?: string;
  /** false for tabs the user may not close, such as the live conversation. */
  readonly closable?: boolean;
}

/** Per-surface tab order. Every surface always has an entry, possibly empty. */
export type WorkspaceSurfaceOrder = Readonly<Record<WorkspaceSurfaceId, readonly string[]>>;

/** Per-surface active tab id, or null when the surface holds no tabs. */
export type WorkspaceSurfaceActive = Readonly<Record<WorkspaceSurfaceId, string | null>>;

/**
 * The whole workspace tab state. `tabs` is the single owner of tab data; the
 * per-surface `order` lists hold ids only, so a tab cannot exist twice with
 * divergent contents and cannot be half-moved.
 */
export interface WorkspaceTabsState {
  readonly tabs: Readonly<Record<string, WorkspaceTab>>;
  readonly order: WorkspaceSurfaceOrder;
  readonly active: WorkspaceSurfaceActive;
}

/** Every state transition the surfaces can request. */
export type WorkspaceTabsAction =
  | { readonly type: "open"; readonly tab: WorkspaceTab; readonly surface: WorkspaceSurfaceId }
  | { readonly type: "close"; readonly tabId: string }
  | { readonly type: "close-others"; readonly tabId: string }
  | { readonly type: "activate"; readonly tabId: string }
  | { readonly type: "retitle"; readonly tabId: string; readonly title: string }
  | { readonly type: "move"; readonly tabId: string; readonly surface: WorkspaceSurfaceId };

/** Builds the empty state: every surface present, no tabs anywhere. */
export function createWorkspaceTabsState(): WorkspaceTabsState {
  return {
    tabs: {},
    order: { main: [], bottom: [], secondary: [] },
    active: { main: null, bottom: null, secondary: null },
  };
}

/** The surface currently holding `tabId`, or null when no surface holds it. */
export function surfaceHolding(
  state: WorkspaceTabsState,
  tabId: string,
): WorkspaceSurfaceId | null {
  for (const surface of WORKSPACE_SURFACE_IDS) {
    if (state.order[surface].includes(tabId)) return surface;
  }
  return null;
}

/** The tabs of one surface, resolved from ids to records, in display order. */
export function tabsOnSurface(
  state: WorkspaceTabsState,
  surface: WorkspaceSurfaceId,
): readonly WorkspaceTab[] {
  const resolved: WorkspaceTab[] = [];
  for (const id of state.order[surface]) {
    const tab = state.tabs[id];
    if (tab) resolved.push(tab);
  }
  return resolved;
}
