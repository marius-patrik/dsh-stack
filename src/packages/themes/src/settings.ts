/**
 * themes settings: the `themes` section and the deployment knobs the
 * plugin reads from its composition entry. The active theme is a user choice
 * (settings document); the themes directory and catalog base are deployment
 * facts (Config).
 * @module themes/settings
 */

import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

/** Settings namespace owning the active-theme choice. */
export const NS = settingsNamespace("themes");

/** The default directory (under the agent home) installed themes live in. */
export const DEFAULT_THEMES_DIR = "themes";

/** The default Open VSX catalog base the search/download verbs hit. */
export const DEFAULT_CATALOG_URL = "https://open-vsx.org";

/** The plugin's deployment configuration. */
export interface ThemesConfig {
  /** Directory (relative to the agent home, or absolute) holding theme files. */
  root: string;
  /** Open VSX catalog base URL for `dsh theme search` / `dsh theme install`. */
  catalogUrl: string;
}

export const ThemesConfig: z<ThemesConfig> = z.object({
  root: z.string().default(DEFAULT_THEMES_DIR),
  catalogUrl: z.string().default(DEFAULT_CATALOG_URL),
});

/** The user-facing section: the id of the currently active theme (empty = built-in). */
export interface ThemesSettings {
  /** Active theme id, or empty for the built-in light/dark/system preference. */
  active: string;
}

export const ThemesSettings: z<ThemesSettings> = z.object({
  active: z.string().default(""),
});
