import type { Context } from "@deepseek-ai/cordis";
import { sidebarPreferences } from "./index.js";
import type { SidebarPreferences, SidebarPreferenceKey } from "./index.js";

export const inject: readonly string[] = [];

declare module "@deepseek-ai/cordis" {
  interface Context {
    /** The page's single sidebar-preferences store; owned here so every surface reads and writes the same state. */
    sidebarPreferences: {
      get(): SidebarPreferences;
      set(key: SidebarPreferenceKey, value: boolean): void;
      update(patch: Partial<SidebarPreferences>): void;
      subscribe(listener: () => void): () => void;
    };
  }
}

/** Provides the page's single shared sidebar-preferences store. */
export function apply(ctx: Context): void {
  ctx.provide("sidebarPreferences", sidebarPreferences);
}
