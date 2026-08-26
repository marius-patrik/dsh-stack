/**
 * Canonical Stack translator service for supported session/event formats.
 */
import { Service, type Context } from "@deepseek-ai/cordis";

export const name = "translator";
export const inject: string[] = [];

export type Format = "opencode" | "claude" | "dsh";

export interface OpenCodeMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; [key: string]: unknown }>;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ClaudeEntry {
  type: "human" | "assistant" | "tool_use" | "tool_result";
  text?: string;
  content?: string;
  [key: string]: unknown;
}

export interface DshEvent {
  type: string;
  seq: number;
  role?: string;
  content?: Array<{ type: string; text?: string; [key: string]: unknown }>;
  timestamp?: string;
  [key: string]: unknown;
}

/** detectFormat implementation. */
export function detectFormat(data: unknown): Format | null {
  if (data === null || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if ("messages" in obj && Array.isArray(obj.messages)) return "opencode";
  if ("entries" in obj && Array.isArray(obj.entries)) return "claude";
  if ("events" in obj && Array.isArray(obj.events)) return "dsh";
  return null;
}

export type TranslateFn = (input: unknown) => unknown;

/** Narrow an unknown value to a dsh document, or throw if it isn't one. */
function asDshDocument(data: unknown): { events: DshEvent[] } {
  if (!data || typeof data !== "object" || !("events" in data) || !Array.isArray(data.events))
    throw new Error("invalid dsh document");
  return data as { events: DshEvent[] };
}

export class TranslatorRegistry {
  private readonly converters = new Map<string, TranslateFn>();

  /** register implementation. */
  register(sourceFormat: Format, targetFormat: Format, fn: TranslateFn): void {
    this.converters.set(`${sourceFormat}->${targetFormat}`, fn);
  }

  /** translate implementation. */
  translate(data: unknown, sourceFormat: Format, targetFormat: Format): unknown {
    if (sourceFormat === targetFormat) return data;
    const fn = this.converters.get(`${sourceFormat}->${targetFormat}`);
    if (fn === undefined) throw new Error(`no converter for ${sourceFormat} -> ${targetFormat}`);
    return fn(data);
  }

  /** supportedConversions implementation. */
  supportedConversions(): readonly string[] {
    return [...this.converters.keys()];
  }
}

/** opencodeToDsh implementation. */
function opencodeToDsh(data: unknown): unknown {
  if (!data || typeof data !== "object" || !("messages" in data) || !Array.isArray(data.messages))
    throw new Error("invalid opencode document");
  const input = data as { messages: OpenCodeMessage[] };
  return {
    events: input.messages.map((msg, seq) => ({
      type:
        msg.role === "user"
          ? "user/message"
          : msg.role === "assistant"
            ? "assistant/message"
            : "system/message",
      seq,
      role: msg.role,
      content:
        typeof msg.content === "string" ? [{ type: "text", text: msg.content }] : msg.content,
      timestamp: msg.timestamp,
    })),
  };
}

/** dshToOpencode implementation. */
function dshToOpencode(data: unknown): unknown {
  const input = asDshDocument(data);
  return {
    messages: input.events
      .filter((event) => event.type.includes("/message"))
      .map((event) => ({
        role: event.role === "system" ? "system" : event.role === "user" ? "user" : "assistant",
        content: event.content ?? [],
        timestamp: event.timestamp,
      })),
  };
}

/** claudeToDsh implementation. */
function claudeToDsh(data: unknown): unknown {
  if (!data || typeof data !== "object" || !("entries" in data) || !Array.isArray(data.entries))
    throw new Error("invalid claude document");
  const input = data as { entries: ClaudeEntry[] };
  return {
    events: input.entries.map((entry, seq) => ({
      type:
        entry.type === "human"
          ? "user/message"
          : entry.type === "assistant"
            ? "assistant/message"
            : entry.type,
      seq,
      role: entry.type === "human" ? "user" : entry.type === "assistant" ? "assistant" : undefined,
      content: [{ type: "text", text: entry.text ?? entry.content ?? "" }],
    })),
  };
}

/** dshToClaude implementation. */
function dshToClaude(data: unknown): unknown {
  const input = asDshDocument(data);
  return {
    entries: input.events
      .filter((event) => event.type.includes("/message"))
      .map((event) => ({
        type: event.role === "user" ? "human" : "assistant",
        text: event.content?.map((chunk) => chunk.text ?? "").join("") ?? "",
      })),
  };
}

export interface Config {
  defaultFormat?: Format;
}

export class TranslatorService extends Service {
  static inject: string[] = [];
  readonly registry = new TranslatorRegistry();

  /** Constructs an instance. */
  constructor(ctx: Context, _config: Config = {}) {
    super(ctx, "translators");
    this.registry.register("opencode", "dsh", opencodeToDsh);
    this.registry.register("dsh", "opencode", dshToOpencode);
    this.registry.register("claude", "dsh", claudeToDsh);
    this.registry.register("dsh", "claude", dshToClaude);
    this.registry.register("opencode", "claude", (data) => dshToClaude(opencodeToDsh(data)));
    this.registry.register("claude", "opencode", (data) => dshToOpencode(claudeToDsh(data)));
  }

  /** register implementation. */
  register(sourceFormat: Format, targetFormat: Format, fn: TranslateFn): void {
    this.registry.register(sourceFormat, targetFormat, fn);
  }
  /** translate implementation. */
  translate(data: unknown, sourceFormat: Format, targetFormat: Format): unknown {
    return this.registry.translate(data, sourceFormat, targetFormat);
  }
  /** supportedConversions implementation. */
  supportedConversions(): readonly string[] {
    return this.registry.supportedConversions();
  }
}

declare module "@deepseek-ai/cordis" {
  interface Context {
    translators: TranslatorService;
  }
}

/** apply implementation. */
export function apply(ctx: Context, config: Config = {}): void {
  ctx.plugin(TranslatorService, config);
  ctx.logger.info(`translator loaded: 6 converters registered`);
}
