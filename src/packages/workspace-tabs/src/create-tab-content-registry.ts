/**
 * Which tab kinds a workspace can host, and how each one renders. Registering a
 * kind makes it hostable on *every* surface at once, which is the property that
 * fixes issue #122: the bottom panel used to understand `terminal` and
 * `container` only, and silently rendered nothing for a conversation it had
 * already taken ownership of.
 *
 * @module @dsh-stack/workspace-tabs/create-tab-content-registry
 */
import type { TabElement } from "./tab-surface-runtime.js";
import type { WorkspaceSurfaceId, WorkspaceTab, WorkspaceTabKind } from "./workspace-tab.js";

/** How one kind of tab presents itself. */
export interface TabContentType {
  readonly kind: WorkspaceTabKind;
  /** Menu label used by the new-tab button and the empty-surface picker. */
  readonly label: string;
  /** Renders the tab's body on `surface`; null means the tab draws no body. */
  render(tab: WorkspaceTab, surface: WorkspaceSurfaceId): TabElement | null;
  /** Builds a fresh tab of this kind, or null when it cannot be created here. */
  create?(surface: WorkspaceSurfaceId): WorkspaceTab | null;
}

/** The set of hostable tab kinds. */
export interface TabContentRegistry {
  register(type: TabContentType): void;
  get(kind: WorkspaceTabKind): TabContentType | undefined;
  /** Kinds the new-tab button offers, in registration order. */
  creatable(): readonly TabContentType[];
}

/** Creates an empty registry. The host fills it once, at bundle load. */
export function createTabContentRegistry(): TabContentRegistry {
  const types = new Map<WorkspaceTabKind, TabContentType>();
  return {
    /** Adds or replaces the renderer for one tab kind. */
    register(type) {
      types.set(type.kind, type);
    },
    get: (kind) => types.get(kind),
    creatable: () => [...types.values()].filter((type) => typeof type.create === "function"),
  };
}

/** The message shown when a tab's kind has no registered renderer. */
export function unrenderableTabMessage(tab: WorkspaceTab): string {
  return `No renderer is registered for "${tab.kind}" tabs, so "${tab.title}" cannot be displayed here.`;
}
