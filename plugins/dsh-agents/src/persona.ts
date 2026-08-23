/**
 * Persona files: the authoring input dsh-agents turns into agent presets.
 *
 * A persona file is either Markdown (optional `---` frontmatter with scalar
 * keys `name`, `description`, `base`; the body is the system prompt) or JSON
 * (`{ name?, description?, base?, prompt }`). The id is the file stem,
 * sanitized to the preset-id character set — the harness's preset ids are
 * directory names under the user preset root.
 *
 * `base` names a shipped preset whose composition the materialized preset is
 * copied from, with the persona text swapped in; absent, the settings
 * `defaultBase` applies, then `standard`.
 * @module dsh-agents/persona
 */

import { basename, extname } from 'node:path'

/** A parsed persona file, ready to be materialized as an agent preset. */
export interface Persona {
  /** Preset id (the materialized directory name). */
  id: string
  /** Display name for the picker; falls back to the id. */
  name?: string
  /** One sentence on what this agent is for. */
  description?: string
  /** Base preset id to compose from; undefined uses the default. */
  base?: string
  /** The persona text (system prompt) the agent runs on. */
  prompt: string
}

/**
 * Sanitize a file stem into a preset id: lowercase, map disallowed characters
 * to `-`, collapse runs, and guarantee a leading alphanumeric. Unusable input
 * (empty after cleanup) falls back to `agent`.
 */
export function sanitizeId(stem: string): string {
  const cleaned = stem
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
  return cleaned === '' ? 'agent' : cleaned
}

/** A scalar value from a persona file, trimmed and unquoted. */
function scalar(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined
  const trimmed = raw.trim()
  if (trimmed === '') return undefined
  const quoted = trimmed.match(/^(['"])([\s\S]*)\1$/)
  return quoted !== null ? quoted[2] : trimmed
}

/** Parse the `key: value` lines of a YAML-ish frontmatter block. */
function frontmatter(text: string): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {}
  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/)
    if (match !== null) {
      const key = match[1]
      if (key !== undefined) out[key] = scalar(match[2])
    }
  }
  return out
}

/** The `---` frontmatter block of a Markdown persona, split from its body. */
function splitMarkdown(content: string): { fields: Record<string, string | undefined>; body: string } {
  const fenced = content.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/)
  if (fenced === null || fenced[1] === undefined || fenced[0] === undefined) return { fields: {}, body: content }
  return { fields: frontmatter(fenced[1]), body: content.slice(fenced[0].length) }
}

/** A persona's optional display metadata, from either frontmatter or JSON. */
interface PersonaFields {
  name?: string
  description?: string
  base?: string
}

/**
 * Parse one persona file's text into a {@link Persona}. A Markdown file's
 * body (after the frontmatter, or the whole file without one) is the prompt;
 * a JSON file's `prompt` is. Fields are trimmed; empty `name`/`description`
 * fall back to absent, and an empty prompt is an error.
 * @param filePath - the authoring file path, used for the stem and extension.
 * @param content - the file text.
 * @throws when the file has no usable prompt.
 */
export function parsePersona(filePath: string, content: string): Persona {
  const extension = extname(filePath).toLowerCase()
  const id = sanitizeId(basename(filePath, extension))
  let fields: PersonaFields = {}
  let prompt = ''

  if (extension === '.json') {
    const parsed = JSON.parse(content) as { name?: unknown; description?: unknown; base?: unknown; prompt?: unknown }
    if (typeof parsed.prompt !== 'string') throw new Error(`${filePath}: a JSON persona needs a string "prompt"`)
    prompt = parsed.prompt
    fields = {
      name: typeof parsed.name === 'string' ? parsed.name : undefined,
      description: typeof parsed.description === 'string' ? parsed.description : undefined,
      base: typeof parsed.base === 'string' ? parsed.base : undefined,
    }
  } else if (extension === '.md') {
    const { fields: parsed, body } = splitMarkdown(content)
    fields = { name: parsed.name, description: parsed.description, base: parsed.base }
    prompt = body
  } else {
    throw new Error(`${filePath}: unsupported persona file type "${extension}" (use .md or .json)`)
  }

  const trimmed = prompt.trim()
  if (trimmed === '') throw new Error(`${filePath}: persona prompt must not be empty`)

  return {
    id,
    ...(fields.name !== undefined ? { name: fields.name } : {}),
    ...(fields.description !== undefined ? { description: fields.description } : {}),
    ...(fields.base !== undefined ? { base: fields.base } : {}),
    prompt: trimmed,
  }
}
