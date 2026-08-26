import { publishCrossBundle, subscribeCrossBundle } from "./cross-bundle-channel.js";

export type SkinId = "deepseek" | "claude" | "codex";

export interface SkinOption {
  readonly id: SkinId;
  readonly label: string;
}

const STORAGE_KEY = "dsh-stack.ui.skin";

/**
 * Cross-bundle change channel. This module is inlined into both
 * `@dsh-stack/skin-settings` and `@dsh-stack/skin-host`, so a module-local
 * listener set never crosses between them -- see ./cross-bundle-channel.ts.
 */
const CHANGE_CHANNEL = "dsh-stack.ui.skin:changed";

export const defaultSkins: readonly SkinOption[] = [
  { id: "deepseek", label: "DeepSeek" },
  { id: "claude", label: "Claude" },
  { id: "codex", label: "Codex" },
];

export interface SkinRuntime {
  getActive(): SkinId;
  setActive(id: SkinId): void;
  subscribe(listener: () => void): () => void;
}

/** createSkinRuntime implementation. */
export function createSkinRuntime(
  options: readonly SkinOption[] = defaultSkins,
  reload: () => void = () => undefined,
): SkinRuntime {
  if (options.length === 0) throw new Error("At least one skin is required");
  const allowed = new Set(options.map((skin) => skin.id));
  const fallback = options[0]!.id;

  return {
    // Deliberately re-read rather than memoised: storage is the single source
    // of truth shared by every bundled copy of this module.
    getActive: () => readStoredSkin(allowed) ?? fallback,
    setActive: (id) => {
      if (!allowed.has(id)) throw new Error(`Unknown skin: ${id}`);
      if (id === (readStoredSkin(allowed) ?? fallback)) return;
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // Storage is unavailable; the broadcast below still updates live
        // subscribers for this page's lifetime.
      }
      publishCrossBundle(CHANGE_CHANNEL);
      reload();
    },
    subscribe: (listener) => subscribeCrossBundle(CHANGE_CHANNEL, listener),
  };
}

/** readStoredSkin implementation. */
function readStoredSkin(allowed: ReadonlySet<SkinId>): SkinId | undefined {
  try {
    const value = localStorage.getItem(STORAGE_KEY) as SkinId | null;
    return value && allowed.has(value) ? value : undefined;
  } catch {
    return undefined;
  }
}
