/**
 * The Anthropic Messages API dialect. User text becomes `text` parts and tool
 * results become `tool_result` parts; assistant text becomes `text` parts and
 * tool calls become `tool_use` parts. Reasoning blocks are dropped (thinking
 * is not configured on this route), and core image blocks are rejected because
 * this wire route is text-only.
 *
 * @module dsh-dialects/claude
 */

import { contentHasImage, LlmError } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, GenerateOptions, Message } from '@deepseek-ai/dsh-llm'
import type { Dialect, DialectAuth, DialectDefaults, WireRequest } from './types.js'
import { parseSseEvents } from './sse.js'
import { translateClaude } from './translate-claude.js'

/** One Anthropic content part. */
type WirePart =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }

/** One request `messages` entry. */
interface WireMessage {
  role: 'user' | 'assistant'
  content: WirePart[]
}

/** One entry of the request `tools` array. */
export interface WireTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

/** The request body for `POST {baseURL}/messages`. */
export interface WireRequestBody {
  model: string
  system?: string
  messages: WireMessage[]
  stream: true
  max_tokens: number
  tools?: WireTool[]
  temperature?: number
  stop_sequences?: string[]
}

/** Join the text blocks of a message. */
function flattenText(blocks: readonly ContentBlock[]): string {
  return blocks
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
}

/** Reject core image content before any text-flattening path can silently erase it. */
function assertTextOnly(blocks: readonly ContentBlock[]): void {
  if (contentHasImage(blocks)) {
    throw new LlmError('The claude dialect does not support image content.', 'UNSUPPORTED_CONTENT')
  }
}

/** Parse a raw tool-arguments JSON string into an object. */
function parseToolInput(argumentsJson: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(argumentsJson)
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  } catch {
    throw new LlmError('assistant tool-call arguments are not valid JSON', 'MALFORMED_TOOL_ARGUMENTS')
  }
}

function serializeAssistant(message: Message): WireMessage {
  const parts: WirePart[] = []
  for (const block of message.content) {
    if (block.type === 'text') parts.push({ type: 'text', text: block.text })
    else if (block.type === 'tool-call') {
      parts.push({ type: 'tool_use', id: block.id, name: block.name, input: parseToolInput(block.arguments) })
    }
  }
  return { role: 'assistant', content: parts }
}

function serializeUser(message: Message): WireMessage {
  const parts: WirePart[] = []
  for (const block of message.content) {
    if (block.type === 'text') parts.push({ type: 'text', text: block.text })
    else if (block.type === 'tool-result') {
      parts.push({
        type: 'tool_result',
        tool_use_id: block.toolCallId,
        content: flattenText(block.content) || '(no output)',
        ...block.isError === true ? { is_error: true } : {},
      })
    }
  }
  return { role: 'user', content: parts }
}

function stripTrailingSlash(base: string): string {
  return base.endsWith('/') ? base.slice(0, -1) : base
}

/**
 * The Anthropic Messages dialect. `baseURL` is the route base (e.g.
 * `https://api.anthropic.com/v1`); the dialect appends `/messages`. Bearer
 * OAuth tokens go in `Authorization`; API keys in `x-api-key`. `max_tokens`
 * is required on the wire and defaults from `defaults.maxTokens`.
 */
export const claudeDialect: Dialect = {
  id: 'claude',

  serialize(options: GenerateOptions, auth: DialectAuth, baseURL: string, defaults: DialectDefaults): WireRequest {
    if (auth.token === undefined && auth.apiKey === undefined) {
      throw new LlmError('no bearer token or API key supplied for a claude dialect request', 'AUTH')
    }
    const messages: WireMessage[] = []
    for (const message of options.messages) {
      assertTextOnly(message.content)
      if (message.role === 'system') continue
      messages.push(message.role === 'assistant' ? serializeAssistant(message) : serializeUser(message))
    }

    const body: WireRequestBody = {
      model: options.model,
      messages,
      stream: true,
      max_tokens: options.maxTokens ?? defaults.maxTokens,
      ...options.system !== undefined ? { system: options.system } : {},
      ...options.tools !== undefined && options.tools.length > 0
        ? {
          tools: options.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters,
          })),
        }
        : {},
      ...options.temperature !== undefined ? { temperature: options.temperature } : {},
      ...options.stop !== undefined ? { stop_sequences: options.stop } : {},
    }

    return {
      url: `${stripTrailingSlash(baseURL)}/messages`,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'text/event-stream',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        ...auth.token !== undefined ? { authorization: `Bearer ${auth.token}` } : {},
        ...auth.apiKey !== undefined ? { 'x-api-key': auth.apiKey } : {},
        ...auth.headers,
      },
      body: JSON.stringify({ ...body, ...defaults.extra }),
      framing: 'sse',
    }
  },

  parse(body, onActivity) {
    return translateClaude(parseSseEvents(body, onActivity))
  },
}
