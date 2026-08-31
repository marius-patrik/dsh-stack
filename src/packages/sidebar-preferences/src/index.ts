export const name = "sidebar-preferences";
export const inject: string[] = [];

/**
 * Host loader entry for the browser-only sidebar-preferences plugin: mounting
 * it puts the package on the loader's entry list so the client-modules
 * scanner picks up its `dsh.client` bundle.
 */
export function apply(): void {}

export interface SidebarPreferences {
  readonly showBrandLogo: boolean;
  readonly showNewConversation: boolean;
  /** Whether the sidebar renders the file/workspace tree region. */
  readonly showFiles: boolean;
}

export type SidebarPreferenceKey = keyof SidebarPreferences;

export const defaultSidebarPreferences: SidebarPreferences = {
  showBrandLogo: true,
  showNewConversation: true,
  showFiles: true,
};

const STORAGE_KEY = "dsh-stack.sidebar.preferences";

/**
 * Change listeners. `sidebarPreferences` is a singleton -- its client plugin
 * provides it as the cordis `sidebarPreferences` service, so every surface
 * shares this one listener set (see #108).
 */
const listeners = new Set<() => void>();

/**
 * Reads persisted sidebar preferences, falling back to defaults. Deliberately
 * uncached: `localStorage` is the durable source of truth, so caching here
 * would let a fresh page load miss a change made in another tab.
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
    showFiles: parsed.showFiles ?? defaultSidebarPreferences.showFiles,
  };
}

/** Persists a new preference state and notifies subscribers. */
function write(next: SidebarPreferences): void {
  try {
    if (typeof localStorage !== "undefined")
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage is unavailable (private mode, blocked site data); the change
    // still notifies live subscribers so they re-render for this page's lifetime.
  }
  for (const listener of listeners) listener();
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
      showFiles: patch.showFiles ?? current.showFiles,
    };
    if (
      next.showBrandLogo === current.showBrandLogo &&
      next.showNewConversation === current.showNewConversation &&
      next.showFiles === current.showFiles
    )
      return;
    write(next);
  },
  /** Subscribes to preference changes and returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
