/**
 * dsh-tweaks v2 settings: the settings-surface schemas for every new feature.
 * Each feature's config is a plain schemastery schema shared between the
 * composition entry, the settings document, and (for the CLI verbs) the
 * launcher-read `settings.yaml` — so the same section shape drives the web
 * Settings UI and the standalone verbs.
 * @module dsh-tweaks/settings
 */

import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'

/** Namespace of the original state-folder + command section. */
export const NS = settingsNamespace('dsh-tweaks')

/** Namespace of the v2 share-links section. */
export const NS_SHARE = settingsNamespace('dsh-tweaks-share')

/** Namespace of the v2 observability (stats) section. */
export const NS_STATS = settingsNamespace('dsh-tweaks-stats')

/** Namespace of the v2 session-UX section. */
export const NS_SESSION = settingsNamespace('dsh-tweaks-session')

/** Namespace of the v2 slash-command registry section. */
export const NS_COMMANDS = settingsNamespace('dsh-tweaks-commands')

/** Namespace of the v2 keybind section. */
export const NS_KEYBINDS = settingsNamespace('dsh-tweaks-keybinds')

/** One self-hosted share-link configuration. */
export interface ShareConfig {
  /** Whether the read-only share route is mounted at all. */
  enabled: boolean
  /** Whether interactive (token-gated) sharing is allowed for this deployment. */
  allowInteractive: boolean
  /** Hosts the share link advertises (Tailscale name etc.); empty = loopback. */
  advertisedHost?: string
  /** Base path the share route mounts under (default `/share`). */
  basePath: string
}

export const ShareConfig: z<ShareConfig> = z.object({
  enabled: z.boolean().default(true),
  allowInteractive: z.boolean().default(false),
  advertisedHost: z.string().default(''),
  basePath: z.string().default('/share'),
})

/** Observability knobs. */
export interface StatsConfig {
  /** Whether `dsh stats`/`dsh sessions` verbs are enabled. */
  enabled: boolean
  /** Stats output format: `table`, `json`, or `csv`. */
  format: 'table' | 'json' | 'csv'
}

export const StatsConfig: z<StatsConfig> = z.object({
  enabled: z.boolean().default(true),
  format: z.union([z.const('table'), z.const('json'), z.const('csv')]).default('table'),
})

/** Session-UX knobs (plan toggle, undo, drag-drop). */
export interface SessionUxConfig {
  /** Whether the Plan/Build toggle command is registered. */
  planToggle: boolean
  /** Whether `/undo` `/redo` fork commands are registered. */
  forkUndo: boolean
  /** Whether image drag-drop is enabled (wires the attachment seam). */
  dragDropImages: boolean
  /** Max image bytes accepted from drag-drop (mirrors the attachment seam). */
  maxImageBytes: number
}

export const SessionUxConfig: z<SessionUxConfig> = z.object({
  planToggle: z.boolean().default(true),
  forkUndo: z.boolean().default(true),
  dragDropImages: z.boolean().default(true),
  maxImageBytes: z.natural().min(1).default(8 * 1024 * 1024),
})

/** One config-file slash command: name + fixed response (echo/hint bridge). */
export interface CommandEntry {
  /** Lowercase command name without the leading slash. */
  name: string
  /** Human-readable summary. */
  description: string
  /** The exact text the command answers with (a templated reply). */
  reply: string
}

export const CommandEntry: z<CommandEntry> = z.object({
  name: z.string(),
  description: z.string(),
  reply: z.string(),
})

/** The commands registry section: a list of config-file commands. */
export interface CommandsConfig {
  enabled: boolean
  commands: CommandEntry[]
}

export const CommandsConfig: z<CommandsConfig> = z.object({
  enabled: z.boolean().default(true),
  commands: z.array(CommandEntry).default([]),
})

/** One keybind: a named action bound to a key chord. */
export interface KeybindEntry {
  /** The action id (e.g. `plan.toggle`, `undo`, `redo`). */
  action: string
  /** The key chord (e.g. `mod+t`, `alt+u`). */
  keys: string
  /** Optional per-keymap override (default keymap implied when absent). */
  when?: string
}

export const KeybindEntry: z<KeybindEntry> = z.object({
  action: z.string(),
  keys: z.string(),
  when: z.string(),
})

/** The keybind section: a keymap of action → chord. */
export interface KeybindsConfig {
  enabled: boolean
  keymap: KeybindEntry[]
}

export const KeybindsConfig: z<KeybindsConfig> = z.object({
  enabled: z.boolean().default(true),
  keymap: z.array(KeybindEntry).default([]),
})
