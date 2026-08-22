export type SkinId = 'deepseek' | 'claude' | 'codex';

export interface SkinOption {
  readonly id: SkinId;
  readonly label: string;
}

const STORAGE_KEY = 'dsh-stack.ui.skin';

export const defaultSkins: readonly SkinOption[] = [
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'claude', label: 'Claude' },
  { id: 'codex', label: 'Codex' },
];

export interface SkinRuntime {
  getActive(): SkinId;
  setActive(id: SkinId): void;
  subscribe(listener: () => void): () => void;
}

export function createSkinRuntime(
  options: readonly SkinOption[] = defaultSkins,
  reload: () => void = () => undefined,
): SkinRuntime {
  if (options.length === 0) throw new Error('At least one skin is required');
  const allowed = new Set(options.map((skin) => skin.id));
  const listeners = new Set<() => void>();
  let active = readStoredSkin(allowed) ?? options[0]!.id;

  return {
    getActive: () => active,
    setActive: (id) => {
      if (!allowed.has(id)) throw new Error(`Unknown skin: ${id}`);
      if (id === active) return;
      active = id;
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // In-memory selection still applies for this process.
      }
      for (const listener of listeners) listener();
      reload();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function readStoredSkin(allowed: ReadonlySet<SkinId>): SkinId | undefined {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as SkinId | null;
    return value && allowed.has(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
