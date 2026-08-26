/**
 * The `gemini-api` provider route: a concrete provider extension plugging into
 * the `providers` registry abstraction (`@dsh-stack/providers`).
 * @module provider-gemini-api
 */

import type { Context } from "@deepseek-ai/cordis";
import type { ProviderRoute } from "@dsh-stack/providers";
import { API_KEY, EFFORTS, GEMINI_CONTEXT, GEMINI_MAX_OUTPUT } from "@dsh-stack/providers";

/** The `gemini-api` provider route. */
export const route: ProviderRoute = {
  id: "gemini-api",
  displayName: "Gemini (API)",
  kind: "api",
  authKind: "api-key",
  dialect: "openai",
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
  authSlots: [API_KEY("GEMINI_API_KEY")],
  catalog: { url: "https://generativelanguage.googleapis.com/v1beta/models", authStyle: "query" },
  probe: { url: "https://generativelanguage.googleapis.com/v1beta/models", authStyle: "query" },
  models: [
    {
      id: "gemini-2.5-pro",
      name: "Gemini 2.5 Pro",
      contextWindow: GEMINI_CONTEXT,
      maxTokens: GEMINI_MAX_OUTPUT,
      reasoning: EFFORTS,
    },
    {
      id: "gemini-2.5-flash",
      name: "Gemini 2.5 Flash",
      contextWindow: GEMINI_CONTEXT,
      maxTokens: GEMINI_MAX_OUTPUT,
      reasoning: EFFORTS,
    },
  ],
  defaultMaxTokens: GEMINI_MAX_OUTPUT,
  defaultContextWindow: GEMINI_CONTEXT,
};

export const name = "provider-gemini-api";
export const inject = ["providers"];

/** apply implementation. */
export function apply(ctx: Context): void {
  ctx.providers.register(route);
}
