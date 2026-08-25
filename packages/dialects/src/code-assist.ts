/**
 * The Google Code Assist dialect. Serialization covers text-only conversation
 * plus tool calls and results; reasoning and image blocks are unsupported on
 * this route. The Code Assist endpoint is a JSON wrapper over the Vertex
 * `GenerateContent` vocabulary: the harness conversation serializes into the
 * inner `request` (contents, systemInstruction, tools, generationConfig,
 * `session_id`), and the request body nests it under `request` alongside
 * `model`, `project`, and `user_prompt_id`. Response SSE payloads are wrapped
 * as `{traceId, response}` and unwrapped before the shared Gemini translator.
 *
 * @module dsh-dialects/code-assist
 */

import { randomUUID } from "node:crypto";
import { contentHasImage, LlmError } from "@deepseek-ai/dsh-llm";
import type { ContentBlock, GenerateOptions } from "@deepseek-ai/dsh-llm";
import type { Dialect, DialectAuth, DialectDefaults, WireRequest } from "./types.js";
import { parseSseEvents } from "./sse.js";
import { translateGemini } from "./translate-gemini.js";
import { serializeContents, buildToolNameIndex } from "./gemini.js";
import type { WireContent } from "./gemini.js";

/** The inner `toVertexGenerateContentRequest` nested under `request`. */
export interface WireCodeAssistRequestBody {
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
  session_id?: string;
}

/** The Code Assist request body: a wrapper over the inner Vertex request. */
export interface WireCodeAssistWrapper {
  model: string;
  project: string;
  user_prompt_id: string;
  request: WireCodeAssistRequestBody;
}

/** Reject core image content before any text-flattening path can silently erase it. */
function assertTextOnly(blocks: readonly ContentBlock[]): void {
  if (contentHasImage(blocks)) {
    throw new LlmError(
      "The code-assist dialect does not support image content.",
      "UNSUPPORTED_CONTENT",
    );
  }
}

/** buildUrl implementation. */
function buildUrl(base: string): string {
  if (base.includes(":streamGenerateContent")) {
    return base.includes("?") ? base : `${base}?alt=sse`;
  }
  return `${base.endsWith("/") ? base.slice(0, -1) : base}:streamGenerateContent?alt=sse`;
}

/**
 * The Code Assist dialect. `baseURL` is the service root (e.g.
 * `https://cloudcode-pa.googleapis.com/v1internal`); the dialect appends
 * `:streamGenerateContent?alt=sse`. Credentials must be an OAuth bearer token;
 * the `session_id`/`user_prompt_id` UUIDs mark one agent turn, and the
 * `x-goog-api-client`/`user-agent` headers are required for quota routing.
 */
export const codeAssistDialect: Dialect = {
  id: "code-assist",

  /** serialize implementation. */
  serialize(
    options: GenerateOptions,
    auth: DialectAuth,
    baseURL: string,
    defaults: DialectDefaults,
  ): WireRequest {
    if (auth.token === undefined || auth.token === "") {
      throw new LlmError(
        "no OAuth bearer token supplied for a code-assist dialect request",
        "AUTH",
      );
    }
    for (const message of options.messages) assertTextOnly(message.content);
    const request: WireCodeAssistRequestBody = {
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
      session_id: randomUUID(),
    };
    const wrapper: WireCodeAssistWrapper = {
      model: options.model,
      project: "",
      user_prompt_id: randomUUID(),
      request,
    };

    return {
      url: buildUrl(baseURL),
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "text/event-stream",
        authorization: `Bearer ${auth.token}`,
        "x-goog-api-client": "gl-node",
        "user-agent": "Antigravity/2.0.1 (Jetbrains; DARWIN_ARM64)",
        ...auth.headers,
      },
      body: JSON.stringify({ ...wrapper, ...defaults.extra }),
      framing: "sse",
    };
  },

  /** parse implementation. */
  parse(body, onActivity) {
    /** unwrap implementation. */
    async function* unwrap(): AsyncIterable<string> {
      for await (const { data } of parseSseEvents(body, onActivity)) {
        let parsed: unknown;
        try {
          parsed = JSON.parse(data);
        } catch {
          // Comments and keep-alives carry no payload; skip them rather than
          // aborting the stream.
          continue;
        }
        const record = parsed as { response?: unknown };
        yield JSON.stringify(record.response ?? record);
      }
    }
    return translateGemini(unwrap());
  },
};
