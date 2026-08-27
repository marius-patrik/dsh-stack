/**
 * Change notification that survives a module being bundled more than once.
 *
 * `src/scripts/client-runtime/client-bundle.ts` inlines every `@dsh-stack/*`
 * dependency into each consuming client bundle, so a stateful module exists as
 * several independent instances on the same page (e.g. one inside
 * `@dsh-stack/skin-settings`, another inside `@dsh-stack/skin-host`). A
 * module-local `Set` of listeners therefore only ever reaches the copy that
 * was mutated.
 *
 * Broadcasting through a DOM event on the global object reaches every copy,
 * because the page has exactly one global event target no matter how many
 * times the module was bundled. Pairing it with a storage-backed read (never an in-module cache)
 * gives one source of truth and one notification path.
 *
 * @module @dsh-stack/plugin-kit/cross-bundle-channel
 */

/**
 * The browser event-target surface this module uses. `globalThis` is typed
 * from Node's ambient declarations here (plugin-kit is platform-agnostic), so
 * the DOM event methods are declared structurally instead.
 */
const crossBundleTarget = globalThis as unknown as {
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
  dispatchEvent?: (event: Event) => boolean;
};

/**
 * Subscribe to cross-bundle change notifications for one storage key.
 * @param channel - event name, unique per store.
 * @param listener - invoked after any copy of the store commits a change.
 * @returns unsubscribe function.
 */
export function subscribeCrossBundle(channel: string, listener: () => void): () => void {
  if (typeof crossBundleTarget.addEventListener !== "function") return () => undefined;
  crossBundleTarget.addEventListener(channel, listener);
  return () => crossBundleTarget.removeEventListener?.(channel, listener);
}

/**
 * Notify every copy of a store that its backing value changed.
 * @param channel - event name, unique per store.
 */
export function publishCrossBundle(channel: string): void {
  if (typeof crossBundleTarget.dispatchEvent !== "function") return;
  crossBundleTarget.dispatchEvent(new Event(channel));
}
