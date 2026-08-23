/**
 * dsh-formatters settings: the `dsh-formatters` section owns the per-extension
 * formatter table and the auto-format-on-edit toggle. The plugin exposes a
 * model-facing `format` tool over the table and reformats files on `edit` /
 * `write` (via the `tools/post-execute` waterfall) when auto-format is on.
 * @module dsh-formatters/settings
 */

import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'

/** Settings namespace owning the formatter table. */
export const NS = settingsNamespace('dsh-formatters')

/**
 * One formatter command: argv[0] is the executable (absolute, or on PATH),
 * the rest are fixed arguments. No shell interpretation.
 */
export interface FormatterCommand {
  /** Executable and fixed arguments; `argv[0]` is the program. */
  argv: string[]
}

export const FormatterCommand: z<FormatterCommand> = z.object({
  argv: z.array(String).required(),
})

/**
 * The user-facing section: extension → formatter command, plus the
 * auto-format-on-edit toggle (default on).
 */
export interface FormatterSettings {
  /** Lowercase leading-dot extension (e.g. `.ts`) → formatter command. */
  formatters: Record<string, FormatterCommand>
  /** Reformat the target file after every successful `edit`/`write`. */
  autoFormatOnEdit: boolean
}

export const FormatterSettings: z<FormatterSettings> = z.object({
  formatters: z.dict(FormatterCommand).default({}),
  autoFormatOnEdit: z.boolean().default(true),
})

/** The plugin's deployment configuration: optional entry-level defaults. */
export interface FormatterConfig {
  /** Extra formatter commands merged under the settings table (settings win). */
  formatters?: Record<string, FormatterCommand>
  /** Deployment default for the auto-format toggle (settings win). */
  autoFormatOnEdit?: boolean
}

export const FormatterConfig: z<FormatterConfig> = z.object({
  formatters: z.dict(FormatterCommand).default({}),
  autoFormatOnEdit: z.boolean().default(true),
})

/** Pick the formatter command for an extension, if one is configured. */
export function formatterFor(
  settings: FormatterSettings | undefined,
  entry: FormatterConfig | undefined,
  ext: string,
): FormatterCommand | undefined {
  return { ...(entry?.formatters ?? {}), ...(settings?.formatters ?? {}) }[ext]
}

/** Whether auto-format is on (settings wins over the deployment default). */
export function autoFormatEnabled(settings: FormatterSettings | undefined, entry: FormatterConfig | undefined): boolean {
  return settings?.autoFormatOnEdit ?? entry?.autoFormatOnEdit ?? true
}
