export interface SidebarPreferences {
  readonly showBrandLogo: boolean;
  readonly showNewConversation: boolean;
}

export type SidebarPreferenceKey = keyof SidebarPreferences;

export const defaultSidebarPreferences: SidebarPreferences = {
  showBrandLogo: true,
  showNewConversation: true,
};

const STORAGE_KEY = 'dsh-stack.sidebar.preferences';
const listeners = new Set<() => void>();
let cached: SidebarPreferences | undefined;

function read(): SidebarPreferences {
  if (cached) return cached;
  let parsed: Partial<SidebarPreferences> = {};
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
    if (value) parsed = JSON.parse(value) as Partial<SidebarPreferences>;
  } catch {
    parsed = {};
  }
  cached = {
    showBrandLogo: parsed.showBrandLogo ?? defaultSidebarPreferences.showBrandLogo,
    showNewConversation: parsed.showNewConversation ?? defaultSidebarPreferences.showNewConversation,
  };
  return cached;
}

function write(next: SidebarPreferences): void {
  cached = next;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The in-memory state remains valid when browser storage is unavailable.
  }
  for (const listener of listeners) listener();
}

export const sidebarPreferences = {
  get(): SidebarPreferences {
    return read();
  },
  set(key: SidebarPreferenceKey, value: boolean): void {
    const current = read();
    if (current[key] === value) return;
    write({ ...current, [key]: value });
  },
  update(patch: Partial<SidebarPreferences>): void {
    const current = read();
    const next = {
      showBrandLogo: patch.showBrandLogo ?? current.showBrandLogo,
      showNewConversation: patch.showNewConversation ?? current.showNewConversation,
    };
    if (next.showBrandLogo === current.showBrandLogo && next.showNewConversation === current.showNewConversation) return;
    write(next);
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
