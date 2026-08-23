/**
 * Translate Anthropic Messages API SSE events into the harness `StreamChunk`
 * protocol. Wire content-block indexes double as harness block indexes (they
 * are strictly first-seen order); each block flushes its `block-end` on its
 * `content_block_stop`. Usage and the terminal finish flush at `message_stop`,
 * so no chunk follows `finish`. The Anthropic message id is returned as
 * adapter replay state.
 *
 * @module dsh-dialects/translate-claude
 */

import { CallId, EMPTY_RESPONSE_CODE, LlmError } from '@deepseek-ai/dsh-llm'
import type { ContentBlock, FinishReason, StreamChunk, TokenUsage } from '@deepseek-ai/dsh-llm'
import type { SseEvent } from './sse.js'

export interface WireUsage {
  input_tokens?: number
  output_tokens?: number
  cache_creation_input_tokens?: number
  cache_read_input_tokens?: number
}

export type WireBlockStart =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'thinking'; thinking: string }

export type WireDelta =
  | { type: 'text_delta'; text: string }
  | { type: 'input_json_delta'; partial_json: string }
  | { type: 'thinking_delta'; thinking: string }
  | { type: 'signature_delta'; signature: string }

export type WireEvent =
  | { type: 'message_start'; message: { id?: string; usage?: WireUsage } }
  | { type: 'content_block_start'; index: number; content_block: WireBlockStart }
  | { type: 'content_block_delta'; index: number; delta: WireDelta }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_delta'; delta: { stop_reason?: string; stop_sequence?: string | null }; usage?: WireUsage }
  | { type: 'message_stop' }
  | { type: 'ping' }
  | { type: 'error'; error: { type?: string; message?: string } }

interface OpenBlock {
  index: number
  kind: 'text' | 'reasoning' | 'tool-call'
  text: string
  callId?: string
  name?: string
}

export function mapClaudeFinishReason(reason: string): FinishReason {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
    case 'pause_turn': return { kind: 'stop' }
    case 'max_tokens': return { kind: 'max-tokens' }
    case 'tool_use': return { kind: 'tool-calls' }
    default:
      return { kind: 'error', failure: { message: `model stopped: ${reason}`, code: reason.toUpperCase() } }
  }
}

export function mapClaudeUsage(usage: WireUsage): TokenUsage {
  return {
    inputTokens: usage.input_tokens ?? 0,
    outputTokens: usage.output_tokens ?? 0,
    ...usage.cache_read_input_tokens !== undefined ? { cacheReadTokens: usage.cache_read_input_tokens } : {},
    ...usage.cache_creation_input_tokens !== undefined ? { cacheWriteTokens: usage.cache_creation_input_tokens } : {},
  }
}

function closeBlock(block: OpenBlock): ContentBlock {
  switch (block.kind) {
    case 'text': return { type: 'text', text: block.text }
    case 'reasoning': return { type: 'reasoning', text: block.text }
    case 'tool-call': return { type: 'tool-call', id: CallId(block.callId ?? ''), name: block.name ?? '', arguments: block.text }
  }
}

export async function* translateClaude(events: AsyncIterable<SseEvent>): AsyncGenerator<StreamChunk> {
  const blocks = new Map<number, OpenBlock>()
  const order: OpenBlock[] = []
  let messageId: string | undefined
  let pendingFinish: FinishReason | undefined
  let pendingUsage: WireUsage | undefined

  for await (const sse of events) {
    if (sse.data.length === 0) continue
    let event: WireEvent
    try {
      event = JSON.parse(sse.data) as WireEvent
    } catch {
      throw new LlmError(`malformed Anthropic SSE payload: ${sse.data.slice(0, 120)}`, 'MALFORMED_RESPONSE')
    }

    switch (event.type) {
      case 'message_start':
        messageId = event.message.id
        if (event.message.usage) pendingUsage = { ...pendingUsage, ...event.message.usage }
        break

      case 'content_block_start': {
        const wire = event.content_block
        const block: OpenBlock = wire.type === 'text'
          ? { index: event.index, kind: 'text', text: wire.text }
          : wire.type === 'thinking'
            ? { index: event.index, kind: 'reasoning', text: wire.thinking }
            : { index: event.index, kind: 'tool-call', text: '', callId: wire.id, name: wire.name }
        blocks.set(event.index, block)
        order.push(block)
        if (block.kind === 'text') {
          yield { type: 'block-start', index: block.index, blockType: 'text' }
          if (block.text.length > 0) yield { type: 'text-delta', index: block.index, text: block.text }
        } else if (block.kind === 'reasoning') {
          yield { type: 'block-start', index: block.index, blockType: 'reasoning' }
          if (block.text.length > 0) yield { type: 'reasoning-delta', index: block.index, text: block.text }
        } else {
          yield { type: 'block-start', index: block.index, blockType: 'tool-call' }
          yield { type: 'tool-call-delta', index: block.index, id: CallId(block.callId ?? ''), name: block.name, argumentsDelta: '' }
        }
        break
      }

      case 'content_block_delta': {
        const block = blocks.get(event.index)
        if (block === undefined) throw new LlmError('Anthropic delta before content_block_start', 'MALFORMED_RESPONSE')
        const delta = event.delta
        if (delta.type === 'text_delta') {
          block.text += delta.text
          yield { type: 'text-delta', index: block.index, text: delta.text }
        } else if (delta.type === 'thinking_delta') {
          block.text += delta.thinking
          yield { type: 'reasoning-delta', index: block.index, text: delta.thinking }
        } else if (delta.type === 'input_json_delta') {
          block.text += delta.partial_json
          yield { type: 'tool-call-delta', index: block.index, id: CallId(block.callId ?? ''), argumentsDelta: delta.partial_json }
        }
        break
      }

      case 'content_block_stop': {
        const block = blocks.get(event.index)
        if (block !== undefined) yield { type: 'block-end', index: block.index, block: closeBlock(block) }
        break
      }

      case 'message_delta':
        if (event.delta.stop_reason !== undefined) pendingFinish = mapClaudeFinishReason(event.delta.stop_reason)
        if (event.usage) pendingUsage = { ...pendingUsage, ...event.usage }
        break

      case 'error':
        throw new LlmError(event.error.message ?? 'Anthropic provider error', 'PROVIDER_ERROR')

      case 'message_stop':
      case 'ping':
        break
    }
  }

  if (pendingUsage) yield { type: 'usage', usage: mapClaudeUsage(pendingUsage) }
  const reason = pendingFinish ?? { kind: 'stop' as const }
  yield {
    type: 'finish',
    reason: reason.kind === 'stop' && order.length === 0
      ? { kind: 'error', failure: { message: 'model returned a completed response with no content', code: EMPTY_RESPONSE_CODE } }
      : reason,
    ...messageId !== undefined ? { replayState: { response: { messageId } } } : {},
  }
}
