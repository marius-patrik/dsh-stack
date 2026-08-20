/**
 * dsh-lsp settings: the `dsh-lsp` section owns the LSP server table. The
 * plugin mounts the harness LSP capability (service definition, the stdio
 * provider with this table, and the model-facing `lsp` tool) on the web
 * profile, so `goToDefinition`/`findReferences`/`goToImplementation`/`hover`
 * work for the agent without touching the pristine harness.
 * @module dsh-lsp/settings
 */

import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { LspLocalServerConfig } from '@deepseek-ai/dsh-lsp-stdio'

/** Settings namespace owning the LSP server table. */
export const NS = settingsNamespace('dsh-lsp')

/** One stdio language server the plugin mounts through `dsh-lsp-stdio`. */
export type LspServerEntry = LspLocalServerConfig

const LspServerEntry: z<LspServerEntry> = z.object({
  command: z.string().required(),
  extensionToLanguage: z.dict(String).required(),
  args: z.array(String).default([]),
  env: z.dict(String).default({}),
  initializationOptions: z.any().default(null),
  configuration: z.any().default(null),
  maxMessageBytes: z.number().default(16_000_000),
  maxStderrBytes: z.number().default(1_000_000),
  maxDocumentBytes: z.number().default(4_000_000),
  shutdownTimeoutMs: z.number().default(5_000),
  killGraceMs: z.number().default(2_000),
})

/** The plugin's deployment configuration: optional boot-time server table. */
export interface LspConfig {
  /** Extra providers merged over the settings table (settings win). */
  servers: Record<string, LspServerEntry>
}

export const LspConfig: z<LspConfig> = z.object({
  servers: z.dict(LspServerEntry).default({}),
})

/** The user-facing section: the live LSP server table. */
export interface LspSettings {
  /** Provider id → stdio server configuration. */
  servers: Record<string, LspServerEntry>
}

export const LspSettings: z<LspSettings> = z.object({
  servers: z.dict(LspServerEntry).default({}),
})
