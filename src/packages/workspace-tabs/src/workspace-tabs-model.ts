export type WorkspaceTabKind = "chat" | "file" | "repo" | "diff" | "terminal" | "container";
export type SplitOrientation = "horizontal" | "vertical";

export interface WorkspaceTab {
  readonly id: string;
  readonly kind: WorkspaceTabKind;
  readonly title: string;
  readonly path?: string;
  readonly pinned?: boolean;
}

export interface WorkspacePane {
  readonly id: string;
  readonly orientation: SplitOrientation;
  readonly tabs: readonly string[];
  readonly activeTabId: string | null;
}

export interface WorkspaceTabsState {
  readonly tabs: Readonly<Record<string, WorkspaceTab>>;
  readonly panes: Readonly<Record<string, WorkspacePane>>;
  readonly mainPaneId: string;
  readonly bottomDockOpen: boolean;
  readonly bottomDockHeight: number;
}

export interface WorkspaceTabsOptions {
  readonly bottomDockHeight?: number;
  readonly idFactory?: () => string;
}

/**
 * `move` relocates an already-open tab. `index` is the insertion position inside
 * `targetPaneId` after the tab has been detached from its current pane; omit it
 * to append. Moving is always a relocation, never a copy: a tab id occupies at
 * most one pane tab list.
 */
export type WorkspaceTabsAction =
  | { type: "open"; tab: WorkspaceTab; paneId?: string }
  | { type: "close"; tabId: string }
  | { type: "close-others"; tabId: string }
  | { type: "activate"; tabId: string }
  | { type: "move"; tabId: string; targetPaneId: string; index?: number }
  | { type: "split"; sourcePaneId: string; orientation: SplitOrientation; tabId?: string }
  | { type: "bottom-dock"; open?: boolean }
  | { type: "bottom-dock-height"; height: number };
