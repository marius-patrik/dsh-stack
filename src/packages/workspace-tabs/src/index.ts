/**
 * `@dsh-stack/workspace-tabs` -- the single owner of workspace tab hosting.
 *
 * The plugin is the abstraction: one tab model, one tab strip, one surface host
 * and one content registry. The main area, the bottom panel and the secondary
 * sidebar are the same components with a different
 * {@link TabSurfacePlacement}; the concrete bodies (a conversation, a tmux
 * session, a container, a file, a repository) are extensions registered into
 * the content registry by whichever client bundle mounts the runtime.
 *
 * @module @dsh-stack/workspace-tabs
 */
import {
  type TabContentRegistry,
  createTabContentRegistry,
} from "./create-tab-content-registry.js";
import { createEmptySurfacePicker } from "./create-empty-surface-picker.js";
import { createTabStrip } from "./create-tab-strip.js";
import { createTabSurface } from "./create-tab-surface.js";
import {
  type WorkspaceTabsStore,
  createWorkspaceTabsStore,
} from "./create-workspace-tabs-store.js";
import type { TabComponent, TabSurfaceChrome, TabSurfaceReact } from "./tab-surface-runtime.js";

export * from "./create-tab-content-registry.js";
export * from "./create-empty-surface-picker.js";
export * from "./create-tab-strip.js";
export * from "./create-tab-surface.js";
export * from "./create-workspace-tabs-store.js";
export * from "./reduce-workspace-tabs.js";
export * from "./tab-menu-items.js";
export * from "./tab-surface-placement.js";
export * from "./tab-surface-runtime.js";
export * from "./workspace-tab.js";

/** Everything a host bundle needs after wiring the runtime once. */
export interface WorkspaceTabsRuntime {
  readonly store: WorkspaceTabsStore;
  readonly registry: TabContentRegistry;
  /** The shared surface host: render it once per placement. */
  readonly TabSurface: TabComponent;
}

/**
 * Wires the shared tab runtime over a host's React and shell chrome. Call once
 * per client bundle: every surface then renders from the same store, so a tab
 * transfer is one state transition rather than a cross-surface handshake.
 */
export function createWorkspaceTabsRuntime(host: {
  readonly react: TabSurfaceReact;
  readonly chrome: TabSurfaceChrome;
}): WorkspaceTabsRuntime {
  const store = createWorkspaceTabsStore();
  const registry = createTabContentRegistry();
  const TabSurface = createTabSurface({
    react: host.react,
    chrome: host.chrome,
    store,
    registry,
    TabStrip: createTabStrip(host.react, host.chrome),
    EmptySurfacePicker: createEmptySurfacePicker(host.react, host.chrome),
  });
  return { store, registry, TabSurface };
}
