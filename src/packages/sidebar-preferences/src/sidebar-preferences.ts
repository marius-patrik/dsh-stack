import { publishCrossBundle, subscribeCrossBundle } from "@dsh-stack/plugin-kit";

/**
 * How the sidebar tree arranges its groups.
 *
 * - `sections` renders each group (Pinned, Terminals, Containers, Host
 *   Machine, Global, Archived) as a discrete block with its own separator.
 * - `unified` renders every group as a node of one continuous tree under a
 *   single root, with no separators between them.
 */
export type SidebarTreeLayout = "sections" | "unified";

export interface SidebarPreferences {
  readonly showBrandLogo: boolean;
  readonly showNewConversation: boolean;
  readonly treeLayout: SidebarTreeLayout;
}

export type SidebarPreferenceKey = keyof SidebarPreferences;

export const defaultSidebarPreferences: SidebarPreferences = {
  showBrandLogo: true,
  showNewConversation: true,
  treeLayout: "sections",
};

const STORAGE_KEY = "dsh-stack.sidebar.preferences";

/**
 * Cross-bundle change channel. This module is inlined into every consuming
 * client bundle, so a module-local listener set would only ever notify the copy
 * that was mutated -- see plugin-kit's cross-bundle-channel.
 */
const CHANGE_CHANNEL = "dsh-stack.sidebar.preferences:changed";

/** Narrows an arbitrary persisted value to a known sidebar tree layout. */
function readTreeLayout(value: unknown): SidebarTreeLayout {
  return value === "unified" || value === "sections" ? value : defaultSidebarPreferences.treeLayout;
}

/**
 * Reads persisted sidebar preferences, falling back to defaults. Deliberately
 * uncached: `localStorage` is the single source of truth shared by every
 * bundled copy of this module, so caching here would let copies diverge.
 */
function read(): SidebarPreferences {
  let parsed: Partial<SidebarPreferences> = {};
  try {
    const value = typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
    if (value) parsed = JSON.parse(value) as Partial<SidebarPreferences>;
  } catch {
    parsed = {};
  }
  return {
    showBrandLogo: parsed.showBrandLogo ?? defaultSidebarPreferences.showBrandLogo,
    showNewConversation:
      parsed.showNewConversation ?? defaultSidebarPreferences.showNewConversation,
    treeLayout: readTreeLayout(parsed.treeLayout),
  };
}

/** Persists a new preference state and notifies subscribers. */
function write(next: SidebarPreferences): void {
  try {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage is unavailable (private mode, blocked site data); the change
    // still broadcasts so live subscribers re-render for this page's lifetime.
  }
  publishCrossBundle(CHANGE_CHANNEL);
}

/** True when two preference states carry identical values. */
function same(left: SidebarPreferences, right: SidebarPreferences): boolean {
  return (
    left.showBrandLogo === right.showBrandLogo &&
    left.showNewConversation === right.showNewConversation &&
    left.treeLayout === right.treeLayout
  );
}

export const sidebarPreferences = {
  /** Returns the current sidebar preferences. */
  get(): SidebarPreferences {
    return read();
  },
  /** Updates one sidebar preference when its value changes. */
  set<Key extends SidebarPreferenceKey>(key: Key, value: SidebarPreferences[Key]): void {
    const current = read();
    if (current[key] === value) return;
    write({ ...current, [key]: value });
  },
  /** Merges a partial sidebar preference update into the current state. */
  update(patch: Partial<SidebarPreferences>): void {
    const current = read();
    const next: SidebarPreferences = {
      showBrandLogo: patch.showBrandLogo ?? current.showBrandLogo,
      showNewConversation: patch.showNewConversation ?? current.showNewConversation,
      treeLayout: patch.treeLayout ?? current.treeLayout,
    };
    if (same(next, current)) return;
    write(next);
  },
  /** Subscribes to preference changes and returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    return subscribeCrossBundle(CHANGE_CHANNEL, listener);
  },
};
