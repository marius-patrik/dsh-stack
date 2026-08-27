import type { WorkspacePane } from "./workspace-tabs-model.js";

/** Copy every pane together with its tab list so a reducer can rewrite the copy in place. */
export function clonePanes(
  panes: Readonly<Record<string, WorkspacePane>>,
): Record<string, WorkspacePane> {
  return Object.fromEntries(
    Object.entries(panes).map(([id, pane]) => [id, { ...pane, tabs: [...pane.tabs] }]),
  );
}
