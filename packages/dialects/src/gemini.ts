/**
 * The Gemini dialect. Serialization covers text-only conversation plus tool
 * calls and results (a `functionCall`/`functionResponse` round trip); reasoning
 * and image blocks are unsupported on this route. Tool results resolve their
 * tool name from the request's own assistant tool-call history.
 *
 * @module dsh-dialects/gemini
 */

import { contentHasImage, LlmError } from "@deepseek-ai/dsh-llm";
import type { CallId, ContentBlock, GenerateOptions, Message } from "@deepseek-ai/dsh-llm";
import type { Dialect, DialectAuth, DialectDefaults, WireRequest } from "./types.js";
import { parseNdjson } from "./ndjson.js";
import { translateGemini } from "./translate-gemini.js";

/** One Gemini content part. */
type WirePart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

/** One `contents` entry; Gemini roles are `user` and `model`. */
export interface WireContent {
  role: "user" | "model";
  parts: WirePart[];
}

/** The request body for a `:streamGenerateContent` call. */
export interface WireRequestBody {
  systemInstruction?: { parts: [{ text: string }] };
  contents: WireContent[];
  tools?: Array<{
    functionDeclarations: Array<{
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
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
    throw new LlmError("The gemini dialect does not support image content.", "UNSUPPORTED_CONTENT");
  }
}

/** Parse a raw tool-arguments JSON string into an object. */
function parseToolArgs(argumentsJson: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(argumentsJson);
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  } catch {
    throw new LlmError(
      "assistant tool-call arguments are not valid JSON",
      "MALFORMED_TOOL_ARGUMENTS",
    );
  }
}

/**
 * Build the call-id → tool-name index from the request's assistant tool-call
 * history, so `functionResponse` parts can name the function they answer.
 * @param messages - the harness conversation.
 * @returns the name lookup for every tool call in the conversation.
 */
export function buildToolNameIndex(messages: Message[]): Map<CallId, string> {
  const index = new Map<CallId, string>();
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    for (const block of message.content) {
      if (block.type === "tool-call") index.set(block.id, block.name);
    }
  }
  return index;
}

/** Serialize the conversation into Gemini contents; empty parts are dropped. */
export function serializeContents(messages: Message[]): WireContent[] {
  const toolNames = buildToolNameIndex(messages);
  const contents: WireContent[] = [];
  for (const message of messages) {
    assertTextOnly(message.content);
    if (message.role === "system") continue;
    const parts: WirePart[] = [];
    if (message.role === "assistant") {
      for (const block of message.content) {
        if (block.type === "text") parts.push({ text: block.text });
        else if (block.type === "tool-call") {
          parts.push({ functionCall: { name: block.name, args: parseToolArgs(block.arguments) } });
        }
      }
    } else {
      for (const block of message.content) {
        if (block.type === "text") parts.push({ text: block.text });
        else if (block.type === "tool-result") {
          const name = toolNames.get(block.toolCallId);
          if (name === undefined) {
            throw new LlmError(
              `tool result for call "${block.toolCallId}" has no tool call in the conversation`,
              "UNSUPPORTED",
            );
          }
          parts.push({
            functionResponse: {
              name,
              response: { result: flattenText(block.content) || "(no output)" },
            },
          });
        }
      }
    }
    if (parts.length > 0) {
      contents.push({ role: message.role === "assistant" ? "model" : "user", parts });
    }
  }
  return contents;
}

/** buildUrl implementation. */
function buildUrl(base: string): string {
  if (base.includes("?")) return base;
  if (base.endsWith(":streamGenerateContent")) return `${base}?alt=sse`;
  return `${base}:streamGenerateContent?alt=sse`;
}

/**
 * The Gemini dialect. `baseURL` is the full endpoint: the caller supplies the
 * `:streamGenerateContent` (or dispatch) URL, with or without a model
 * placeholder; the dialect appends `?alt=sse` when no query is present.
 * Credentials are `__Secure-` cookies or an `x-goog-api-key`.
 */
export const geminiDialect: Dialect = {
  id: "gemini",

    /** serialize implementation. */
serialize(
    options: GenerateOptions,
    auth: DialectAuth,
    baseURL: string,
    defaults: DialectDefaults,
  ): WireRequest {
    if (auth.cookies === undefined && auth.apiKey === undefined) {
      throw new LlmError("no cookies or API key supplied for a gemini dialect request", "AUTH");
    }
    const body: WireRequestBody = {
      contents: serializeContents(options.messages),
      ...(options.system !== undefined
        ? { systemInstruction: { parts: [{ text: options.system }] } }
        : {}),
      ...(options.tools !== undefined && options.tools.length > 0
        ? {
            tools: [
              {
                functionDeclarations: options.tools.map((tool) => ({
                  name: tool.name,
                  description: tool.description,
                  parameters: tool.parameters,
                })),
              },
            ],
          }
        : {}),
      generationConfig: {
        maxOutputTokens: options.maxTokens ?? defaults.maxTokens,
        ...(options.temperature !== undefined ? { temperature: options.temperature } : {}),
        ...(options.stop !== undefined ? { stopSequences: options.stop } : {}),
      },
    };

    const cookieHeader =
      auth.cookies !== undefined
        ? Object.entries(auth.cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join("; ")
        : undefined;

    return {
      url: buildUrl(baseURL),
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookieHeader !== undefined ? { cookie: cookieHeader } : {}),
        ...(auth.apiKey !== undefined ? { "x-goog-api-key": auth.apiKey } : {}),
        ...auth.headers,
      },
      body: JSON.stringify({ ...body, ...defaults.extra }),
      framing: "ndjson",
    };
  },

    /** parse implementation. */
parse(body, onActivity) {
    return translateGemini(parseNdjson(body, onActivity));
  },
};
