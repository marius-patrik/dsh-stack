/**
 * Change notification that survives a module being bundled more than once.
 *
 * `src/scripts/client-runtime/client-bundle.ts` inlines every `@dsh-stack/*`
 * dependency into each consuming client bundle, so a stateful module like this
 * one exists as several independent instances on the same page: one inside
 * `@dsh-stack/skin-settings`, another inside `@dsh-stack/skin-host`. A
 * module-local `Set` of listeners therefore only ever reaches the copy that was
 * mutated, which is why picking a skin in Settings left the brand slots on the
 * old skin.
 *
 * Broadcasting through a DOM event on `window` reaches every copy, because the
 * page has exactly one `window` no matter how many times the module was
 * bundled. Pairing it with a storage-backed read (never an in-module cache)
 * gives one source of truth and one notification path.
 *
 * @module @dsh-stack/skin-runtime/cross-bundle-channel
 */

/**
 * Subscribe to cross-bundle change notifications for one storage key.
 * @param channel - event name, unique per store.
 * @param listener - invoked after any copy of the store commits a change.
 * @returns unsubscribe function.
 */
export function subscribeCrossBundle(channel: string, listener: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(channel, listener);
  return () => window.removeEventListener(channel, listener);
}

/**
 * Notify every copy of a store that its backing value changed.
 * @param channel - event name, unique per store.
 */
export function publishCrossBundle(channel: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(channel));
}
