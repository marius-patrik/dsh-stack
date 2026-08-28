import { publishCrossBundle, subscribeCrossBundle } from "@dsh-stack/plugin-kit";

export type SkinId = "deepseek" | "claude" | "codex";

export interface SkinOption {
  readonly id: SkinId;
  readonly label: string;
}

const STORAGE_KEY = "dsh-stack.ui.skin";

/**
 * In-memory mirror used when `localStorage` is unavailable (Node/SSR) or
 * blocked. Storage stays the cross-bundle source of truth; this only covers
 * hosts with no storage at all.
 */
let memorySkin: SkinId | undefined;

/**
 * Cross-bundle change channel. This module is inlined into both
 * `@dsh-stack/skin-settings` and `@dsh-stack/skin-host`, so a module-local
 * listener set never crosses between them -- see plugin-kit's cross-bundle-channel.
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

/**
 * Creates a skin runtime environment.
 *
 * @param options - An array of skin options, at least one of which is required.
 * @param reload - A function to reload the skin runtime.
 * @returns A SkinRuntime instance that manages skin activation.
 * @throws Will throw an error if no skins are provided or an unknown skin ID is set.
 */
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
      memorySkin = id;
      try {
        if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, id);
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
    if (typeof localStorage !== "undefined") {
      const value = localStorage.getItem(STORAGE_KEY) as SkinId | null;
      if (value && allowed.has(value)) return value;
    }
  } catch {
    // Storage blocked (private mode etc.); fall through to the memory mirror.
  }
  return memorySkin;
}
