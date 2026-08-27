/**
 * Browser half of the sidebar preference store.
 *
 * `src/scripts/client-runtime/client-bundle.ts` inlines `@dsh-stack/*`
 * dependencies into each consuming bundle, so any package tsdown builds gets
 * its own copy of the store and shares state through `localStorage` and the
 * cross-bundle channel. Hand-authored client bundles -- `@dsh-stack/providers`
 * concatenates its browser half rather than bundling it -- have no import to
 * inline, so this half publishes the one store on the page and announces that
 * it is there. That keeps a single implementation owner for the preferences
 * instead of a second reader copied into the hand-authored bundle.
 *
 * @module @dsh-stack/sidebar-preferences/client
 */
import { sidebarPreferences } from "./sidebar-preferences.js";

/** Event announcing that the store is on the page, for consumers that loaded first. */
export const SIDEBAR_PREFERENCES_INSTALLED_EVENT = "dsh-stack.sidebar.preferences:installed";

/** The global the store is published under. */
export const SIDEBAR_PREFERENCES_GLOBAL = "__dshSidebarPreferences";

/** The page surface this module publishes onto. */
type PreferenceHost = Record<string, unknown> & {
  dispatchEvent?: (event: Event) => boolean;
};

/** Publish the store on the page and announce it. */
function install(): void {
  const host = globalThis as unknown as PreferenceHost;
  if (host[SIDEBAR_PREFERENCES_GLOBAL] === sidebarPreferences) return;
  host[SIDEBAR_PREFERENCES_GLOBAL] = sidebarPreferences;
  host.dispatchEvent?.(new Event(SIDEBAR_PREFERENCES_INSTALLED_EVENT));
}

install();

/** Cordis client services this plugin's `apply` reaches for; it needs none. */
export const inject: string[] = [];

/** Republishes the store, so a reload of this entry re-announces it. */
export function apply(): void {
  install();
}
