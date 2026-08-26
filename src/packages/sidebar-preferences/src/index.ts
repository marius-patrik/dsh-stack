import { publishCrossBundle, subscribeCrossBundle } from "./cross-bundle-channel.js";

export interface SidebarPreferences {
  readonly showBrandLogo: boolean;
  readonly showNewConversation: boolean;
}

export type SidebarPreferenceKey = keyof SidebarPreferences;

export const defaultSidebarPreferences: SidebarPreferences = {
  showBrandLogo: true,
  showNewConversation: true,
};

const STORAGE_KEY = "dsh-stack.sidebar.preferences";

/**
 * Cross-bundle change channel. This module is inlined into every consuming
 * client bundle, so a module-local listener set would only ever notify the copy
 * that was mutated -- see ./cross-bundle-channel.ts.
 */
const CHANGE_CHANNEL = "dsh-stack.sidebar.preferences:changed";

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

export const sidebarPreferences = {
  /** Returns the current sidebar preferences. */
  get(): SidebarPreferences {
    return read();
  },
  /** Updates one sidebar preference when its value changes. */
  set(key: SidebarPreferenceKey, value: boolean): void {
    const current = read();
    if (current[key] === value) return;
    write({ ...current, [key]: value });
  },
  /** Merges a partial sidebar preference update into the current state. */
  update(patch: Partial<SidebarPreferences>): void {
    const current = read();
    const next = {
      showBrandLogo: patch.showBrandLogo ?? current.showBrandLogo,
      showNewConversation: patch.showNewConversation ?? current.showNewConversation,
    };
    if (
      next.showBrandLogo === current.showBrandLogo &&
      next.showNewConversation === current.showNewConversation
    )
      return;
    write(next);
  },
  /** Subscribes to preference changes and returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    return subscribeCrossBundle(CHANGE_CHANNEL, listener);
  },
};
