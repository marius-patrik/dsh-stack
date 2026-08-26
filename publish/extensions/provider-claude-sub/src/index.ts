/**
 * The `claude-sub` provider route: a concrete provider extension plugging into
 * the `providers` registry abstraction (`@dsh-stack/providers`).
 * @module provider-claude-sub
 */

import type { Context } from "@deepseek-ai/cordis";
import type { ProviderRoute } from "@dsh-stack/providers";
import {
  CLAUDE_CONTEXT,
  CLAUDE_HAIKU_MODEL,
  CLAUDE_MAX_OUTPUT,
  EFFORTS,
  HEADERS,
  TOKEN,
} from "@dsh-stack/providers";

/** The `claude-sub` provider route. */
export const route: ProviderRoute = {
  id: "claude-sub",
  displayName: "Claude (Subscription)",
  kind: "subscription",
  authKind: "oauth",
  dialect: "claude",
  baseURL: "https://api.anthropic.com/v1",
  headers: HEADERS({ "anthropic-beta": "oauth-2025-04-20" }),
  authSlots: [TOKEN("CLAUDE_SUB_OAUTH_TOKEN")],
  catalog: { url: "https://api.anthropic.com/v1/models" },
  probe: { url: "https://api.anthropic.com/v1/models" },
  models: [
    {
      id: "claude-opus-5",
      name: "Claude Opus 5",
      contextWindow: CLAUDE_CONTEXT,
      maxTokens: CLAUDE_MAX_OUTPUT,
      reasoning: EFFORTS,
    },
    {
      id: "claude-sonnet-5",
      name: "Claude Sonnet 5",
      contextWindow: CLAUDE_CONTEXT,
      maxTokens: CLAUDE_MAX_OUTPUT,
      reasoning: EFFORTS,
    },
    {
      id: "claude-sonnet-4-6",
      name: "Claude Sonnet 4.6",
      contextWindow: CLAUDE_CONTEXT,
      maxTokens: CLAUDE_MAX_OUTPUT,
      reasoning: EFFORTS,
    },
    {
      id: "claude-opus-4-8",
      name: "Claude Opus 4.8",
      contextWindow: CLAUDE_CONTEXT,
      maxTokens: CLAUDE_MAX_OUTPUT,
      reasoning: EFFORTS,
    },
    CLAUDE_HAIKU_MODEL,
  ],
  defaultMaxTokens: CLAUDE_MAX_OUTPUT,
  defaultContextWindow: CLAUDE_CONTEXT,
};

export const name = "provider-claude-sub";
export const inject = ["providers"];

/** apply implementation. */
export function apply(ctx: Context): void {
  ctx.providers.register(route);
}
