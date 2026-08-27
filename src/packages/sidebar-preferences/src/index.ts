/**
 * Host loader entry for the sidebar preference store, plus the store itself.
 *
 * Mounting the package puts it on the loader's entry list so the
 * client-modules scanner picks up its `dsh.client` bundle -- which is how the
 * store reaches client bundles that are not built by tsdown and therefore
 * cannot inline it.
 *
 * @module @dsh-stack/sidebar-preferences
 */
export * from "./sidebar-preferences.js";

export const name = "sidebar-preferences";

/** Host loader entry; the preference store is browser-only. */
export function apply(): void {}
