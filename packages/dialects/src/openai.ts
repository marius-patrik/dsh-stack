/**
 * The OpenAI-compatible chat-completions dialect. Serialization follows the
 * `dsh-llm-deepseek` conventions: user text is joined, assistant text becomes
 * `content`, tool calls become `tool_calls`, tool results become separate
 * `tool` messages, and assistant reasoning is replayed as `reasoning_content`
 * only on tool-call turns. Core image blocks are rejected explicitly because
 * this wire route is text-only.
 *
 * @module dsh-dialects/openai
 */

import { contentHasImage, LlmError } from "@deepseek-ai/dsh-llm";
import type { ContentBlock, GenerateOptions, Message } from "@deepseek-ai/dsh-llm";
import type { Dialect, DialectAuth, DialectDefaults, WireRequest } from "./types.js";
import { parseSseData } from "./sse.js";
import { translateOpenAi } from "./translate-openai.js";

/** A request `messages` entry, discriminated on `role`. */
type WireMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "tool"; tool_call_id: string; content: string }
  | {
      role: "assistant";
      content: string;
      /** CoT passback on tool-call turns; ignored on tool-call-free turns. */
      reasoning_content?: string;
      tool_calls?: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }>;
    };

/** The request body for `POST {baseURL}/chat/completions`. */
export interface WireRequestBody {
  model: string;
  messages: WireMessage[];
  stream: true;
  stream_options: { include_usage: true };
  tools?: Array<{
    type: "function";
    function: { name: string; description: string; parameters: Record<string, unknown> };
  }>;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
  /**
   * Reasoning depth for models that expose it. The OpenAI-compatible spelling,
   * which Zen, Kimi, Grok, DeepSeek and OpenAI all accept; providers that do
   * not understand it ignore an unknown body field rather than failing, and the
   * field is only sent when the caller actually picked an effort.
   */
  reasoning_effort?: string;
}

/** Join the text blocks of a message. */
function flattenText(blocks: readonly ContentBlock[]): string {
  return blocks
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** Reject core image content before any text-flattening path can silently erase it. */
function assertTextOnly(blocks: readonly ContentBlock[]): void {
  if (contentHasImage(blocks)) {
    throw new LlmError("The openai dialect does not support image content.", "UNSUPPORTED_CONTENT");
  }
}

/** Serialize one assistant message (text + reasoning + tool calls). */
function serializeAssistant(message: Message): WireMessage {
  const text = flattenText(message.content);
  const reasoning = message.content
    .filter((block) => block.type === "reasoning")
    .map((block) => block.text)
    .join("");
  const toolCalls = message.content
    .filter((block) => block.type === "tool-call")
    .map((block) => ({
      id: block.id,
      type: "function" as const,
      function: { name: block.name, arguments: block.arguments },
    }));
  return {
    role: "assistant",
    content: text,
    ...(toolCalls.length > 0 && reasoning.length > 0 ? { reasoning_content: reasoning } : {}),
    ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
  };
}

/**
 * Serialize the conversation. `tool-result` blocks become standalone
 * `{role: 'tool'}` messages; a mixed user message contributes its text first
 * and its tool results as separate wire messages after.
 * @param messages - the harness conversation, in order.
 * @returns the wire messages; order preserved, each tool result expanded into its own entry.
 */
export function serializeMessages(messages: Message[]): WireMessage[] {
  const wire: WireMessage[] = [];
  for (const message of messages) {
    assertTextOnly(message.content);
    if (message.role === "system") {
      wire.push({ role: "system", content: flattenText(message.content) });
      continue;
    }
    if (message.role === "assistant") {
      wire.push(serializeAssistant(message));
      continue;
    }
    const toolResults = message.content.filter((block) => block.type === "tool-result");
    const text = flattenText(message.content);
    if (text.length > 0 || toolResults.length === 0) {
      wire.push({ role: "user", content: text });
    }
    for (const result of toolResults) {
      wire.push({
        role: "tool",
        tool_call_id: result.toolCallId,
        content: flattenText(result.content) || "(no output)",
      });
    }
  }
  return wire;
}

/** stripTrailingSlash implementation. */
function stripTrailingSlash(base: string): string {
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

/**
 * The OpenAI-compatible dialect. `baseURL` is the route base (e.g.
 * `https://api.kimi.com/coding/v1`); the dialect appends `/chat/completions`.
 * The request always streams with usage reporting on; optional fields are
 * omitted rather than sent as null. `defaults.extra` fields are merged into
 * the body verbatim (provider-specific toggles such as DeepSeek's
 * `thinking`).
 */
export const openaiDialect: Dialect = {
  id: "openai",

  /** serialize implementation. */
  serialize(
    options: GenerateOptions,
    auth: DialectAuth,
    baseURL: string,
    defaults: DialectDefaults,
  ): WireRequest {
    const bearer = auth.token ?? auth.apiKey;
    if (bearer === undefined || bearer === "") {
      throw new LlmError(
        "no API key or bearer token supplied for an openai dialect request",
        "AUTH",
      );
    }
    const messages: WireMessage[] = [];
    if (options.system !== undefined) {
      messages.push({ role: "system", content: options.system });
    }
    messages.push(...serializeMessages(options.messages));

    const body: WireRequestBody = {
      model: options.model,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      ...(options.tools !== undefined && options.tools.length > 0
        ? {
            tools: options.tools.map((tool) => ({
              type: "function" as const,
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
          }
        : {}),
      ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
      ...(options.maxTokens === undefined ? {} : { max_tokens: options.maxTokens }),
      ...(options.stop !== undefined ? { stop: options.stop } : {}),
      ...(options.reasoningEffort !== undefined
        ? { reasoning_effort: options.reasoningEffort }
        : {}),
    };

    return {
      url: `${stripTrailingSlash(baseURL)}/chat/completions`,
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        authorization: `Bearer ${bearer}`,
        ...auth.headers,
      },
      body: JSON.stringify({ ...body, ...defaults.extra }),
      framing: "sse",
    };
  },

  /** parse implementation. */
  parse(body, onActivity) {
    return translateOpenAi(parseSseData(body, onActivity));
  },
};
