/**
 * Route descriptors for the dsh provider adapters (five subscription routes
 * plus eight billable API-key routes). A route couples a provider id with the
 * wire dialect it speaks, the endpoint it talks to, the fixed headers and
 * credential slots it needs, and the advisory model catalog it advertises to
 * discovery consumers.
 * @module providers/providers
 */

import type { DialectId } from "@dsh-stack/dialects";
import type { CatalogSource } from "./catalog.js";
import { ANTIGRAVITY_PROJECT_HEADER } from "@dsh-stack/dialects";

/** How a provider authenticates; the launcher filter and account UI group on this. */
export type AuthKind = "api-key" | "oauth" | "none";

/** Whether a provider is pay-as-you-go or a flat subscription. */
export type ProviderKind = "api" | "subscription" | "local";

/** The credential material a route needs on every request. */
export type CredentialSlotKind = "apiKey" | "token" | "cookie" | "header";

/** One credential slot: what it fills in the wire auth and where it is stored. */
export interface CredentialSlot {
  slot: CredentialSlotKind;
  /** Wire cookie name; required exactly when `slot === 'cookie'`. */
  cookieName?: string;
  /**
   * Wire header name; required exactly when `slot === 'header'`. For per-account
   * facts a route must send that are not themselves the credential — the
   * Antigravity project id, which the dialect cannot fetch for itself.
   */
  headerName?: string;
  /** Reference name stored through the account seam (vault or credential env). */
  ref: string;
}

/** How a quota probe authenticates; default is `Authorization: Bearer`. */
export type ProbeAuthStyle = "bearer" | "x-api-key" | "query";

/**
 * A lightweight quota probe for a route: the endpoint the quota registry hits
 * to report availability. The probe reuses the route's fixed headers and its
 * first credential slot as the token reference, so only the probe-specific
 * facts live here.
 */
export interface ProviderProbe {
  /** Probe endpoint; usually the provider's model-listing URL. */
  url: string;
  /** HTTP method; defaults to GET. */
  method?: string;
  /** Request body; sent with a JSON content type when present. */
  body?: string;
  /**
   * Extra headers for this probe alone, merged over the route's fixed headers.
   * A streaming endpoint that is probed without its `accept` answers 500
   * instead of the status the light is asking about.
   */
  headers?: Record<string, string>;
  /** How the token is sent; defaults to `bearer`. */
  authStyle?: ProbeAuthStyle;
}

/** One selectable reasoning effort for a model. */
export interface ProviderReasoningEffort {
  /** Value passed back as `GenerateOptions.reasoningEffort`. */
  id: string;
  /** Label shown in the selector. */
  name: string;
  /** What distinguishes this effort from the neighbouring ones. */
  description?: string;
}

/**
 * Selectable reasoning efforts for one model. The harness already carries
 * these to the model picker (`LlmResolvedModelInfo.reasoning`); declaring them
 * here is what makes the picker offer effort at all for a dsh route.
 */
export interface ProviderReasoning {
  efforts: readonly ProviderReasoningEffort[];
  /** Effort used when the caller names none; absence keeps the provider's own. */
  defaultEffort?: string;
}

/** One advisory model entry advertised for a route. */
export interface ProviderCatalogModel {
  /** Wire model id accepted by the endpoint. */
  id: string;
  /** Selector label; defaults to `id`. */
  name?: string;
  /** Known combined context capacity. */
  contextWindow: number;
  /** Per-request output cap for this model. */
  maxTokens: number;
  /** Selectable reasoning efforts, for models that expose them. */
  reasoning?: ProviderReasoning;
}

/** A statically declared provider route. */
export interface ProviderRoute {
  /** Stable provider id used by `ctx.llm` (`GenerateOptions.provider`). */
  id: string;
  /** Human name for selectors and diagnostics. */
  displayName: string;
  /** Pay-as-you-go vs subscription, for the provider filter. */
  kind: ProviderKind;
  /** How the route authenticates, for the account manager and filter. */
  authKind: AuthKind;
  /** Wire dialect the route speaks. */
  dialect: DialectId;
  /** Default endpoint; `{model}` is substituted with the request model when present. */
  baseURL: string;
  /**
   * Fixed headers merged into every request of this route (identity or
   * protocol-version markers the wire requires beyond Authorization).
   */
  headers?: Record<string, string>;
  /** Credential slots resolved per request. */
  authSlots: readonly CredentialSlot[];
  /** Advisory models advertised to discovery consumers. */
  models: readonly ProviderCatalogModel[];
  /** Default per-request output cap. */
  defaultMaxTokens: number;
  /** Default context capacity used for uncatalogued models. */
  defaultContextWindow: number;
  /** Quota probe for the quotas registry; omitted routes are not probed. */
  probe?: ProviderProbe;
  /**
   * Live model-listing endpoint. When present the adapter discovers this
   * route's models from the provider and treats `models` above as the
   * fallback, so a new model release reaches the selector without an edit
   * here. Routes that publish no listing (Gemini's Code Assist surface) omit
   * it and stay on the static table.
   */
  catalog?: CatalogSource;
}

/**
 * The effort ladder shared by the routes whose wire takes a named level
 * (`reasoning_effort` on the OpenAI wire, a thinking budget on Anthropic's).
 * One vocabulary keeps the picker consistent across providers rather than
 * showing a different set of words per route.
 */
const EFFORTS: ProviderReasoning = {
  efforts: [
    { id: "low", name: "Low", description: "Answer quickly, with little deliberation" },
    { id: "medium", name: "Medium", description: "Balance deliberation against latency" },
    { id: "high", name: "High", description: "Deliberate at length before answering" },
  ],
  defaultEffort: "medium",
};

const /** TOKEN implementation. */
  TOKEN = (ref: string): CredentialSlot => ({ slot: "token", ref });
const /** API_KEY implementation. */
  API_KEY = (ref: string): CredentialSlot => ({ slot: "apiKey", ref });
const /** HEADER implementation. */
  HEADER = (headerName: string, ref: string): CredentialSlot => ({
    slot: "header",
    headerName,
    ref,
  });
const /** HEADERS implementation. */ HEADERS = (headers: Record<string, string>) => headers;

// Per-model windows, cross-checked against GET https://api.kimi.com/coding/v1/models
// (2026-08-18): K3 carries the 1M window, every other coding model 256k. The
// wire ids below are the aliases this route has been serving; the catalog
// endpoint lists them under its own names (kimi-for-coding, k3, k3-256k).
const KIMI_CONTEXT = 262_144;
const KIMI_K3_CONTEXT = 1_048_576;
const KIMI_MAX_OUTPUT = 256_000;
const CLAUDE_CONTEXT = 1_000_000;
const CLAUDE_MAX_OUTPUT = 128_000;
const GEMINI_CONTEXT = 1_000_000;
const GEMINI_MAX_OUTPUT = 64_000;
const OPENAI_MAX_OUTPUT = 128_000;
const OPENAI_DEFAULT_CONTEXT = 128_000;
const XAI_CONTEXT = 256_000;
const XAI_MAX_OUTPUT = 32_000;
const MISTRAL_CONTEXT = 128_000;
const MISTRAL_MAX_OUTPUT = 8_000;
const DEEPSEEK_CONTEXT = 128_000;
const DEEPSEEK_MAX_OUTPUT = 8_000;
const GROQ_CONTEXT = 128_000;
const GROQ_MAX_OUTPUT = 8_000;
const ZEN_CONTEXT = 256_000;
const ZEN_MAX_OUTPUT = 64_000;
const ZEN_CLAUDE_CONTEXT = 1_000_000;
const ZEN_CLAUDE_MAX_OUTPUT = 128_000;

/**
 * The provider routes: the five subscription adapters plus eight billable
 * API-key routes. Base URLs and model catalogs are advisory v1 defaults;
 * per-provider overrides arrive through the `providers` settings section
 * without a restart. Under the default `subscription-only` filter the API
 * routes are hidden from discovery and refused at dispatch; `mode: "all"`
 * offers them.
 */
export const PROVIDER_ROUTES: readonly ProviderRoute[] = [
  {
    id: "kimi-code",
    displayName: "Kimi Code (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://api.kimi.com/coding/v1",
    authSlots: [API_KEY("KIMI_API_KEY")],
    catalog: { url: "https://api.kimi.com/coding/v1/models" },
    // Same endpoint as the subscription route, and the API key resolves the
    // same catalog, so the two advertise the same models rather than pinning
    // this one to an older generation.
    models: [
      {
        id: "kimi-k3",
        name: "Kimi K3",
        contextWindow: KIMI_K3_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "kimi-k2.7-code",
        name: "Kimi K2.7 Code",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "kimi-k2.6",
        name: "Kimi K2.6",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "kimi-k2.5",
        name: "Kimi K2.5",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
      },
      {
        id: "kimi-k2.5-thinking",
        name: "Kimi K2.5 Thinking",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
    ],
    defaultMaxTokens: KIMI_MAX_OUTPUT,
    defaultContextWindow: KIMI_CONTEXT,
  },
  {
    id: "kimi-sub",
    displayName: "Kimi Code (Subscription)",
    kind: "subscription",
    authKind: "oauth",
    dialect: "openai",
    baseURL: "https://api.kimi.com/coding/v1",
    authSlots: [TOKEN("KIMI_SUB_OAUTH_TOKEN")],
    catalog: { url: "https://api.kimi.com/coding/v1/models" },
    // The catalog endpoint answers 200 on an exhausted plan, so probing it
    // reports "healthy" while every completion 403s. A one-token completion is
    // the smallest request that actually exercises the quota the panel claims
    // to be reporting.
    probe: {
      url: "https://api.kimi.com/coding/v1/chat/completions",
      method: "POST",
      body: JSON.stringify({
        model: "kimi-k3",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    },
    models: [
      {
        id: "kimi-k3",
        name: "Kimi K3",
        contextWindow: KIMI_K3_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "kimi-k2.7-code",
        name: "Kimi K2.7 Code",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "kimi-k2.6",
        name: "Kimi K2.6",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "kimi-k2.5",
        name: "Kimi K2.5",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
      },
    ],
    defaultMaxTokens: KIMI_MAX_OUTPUT,
    defaultContextWindow: KIMI_CONTEXT,
  },
  {
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
      {
        id: "claude-haiku-4-5",
        name: "Claude Haiku 4.5",
        contextWindow: 200_000,
        maxTokens: 64_000,
        reasoning: EFFORTS,
      },
    ],
    defaultMaxTokens: CLAUDE_MAX_OUTPUT,
    defaultContextWindow: CLAUDE_CONTEXT,
  },
  {
    id: "grok-sub",
    displayName: "Grok (Subscription)",
    kind: "subscription",
    authKind: "oauth",
    dialect: "openai",
    baseURL: "https://cli-chat-proxy.grok.com/v1",
    headers: HEADERS({
      "x-xai-token-auth": "xai-grok-cli",
      "x-grok-client-identifier": "grok-shell",
      "x-grok-client-version": "0.2.93",
    }),
    authSlots: [TOKEN("GROK_SUB_OAUTH_TOKEN")],
    catalog: { url: "https://cli-chat-proxy.grok.com/v1/models" },
    probe: { url: "https://cli-chat-proxy.grok.com/v1/models" },
    models: [
      {
        id: "grok-4.6",
        name: "Grok 4.6",
        contextWindow: XAI_CONTEXT,
        maxTokens: XAI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "grok-4.5",
        name: "Grok 4.5",
        contextWindow: XAI_CONTEXT,
        maxTokens: XAI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "grok-composer-2.5-fast",
        name: "Grok Composer 2.5 Fast",
        contextWindow: XAI_CONTEXT,
        maxTokens: XAI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
    ],
    defaultMaxTokens: XAI_MAX_OUTPUT,
    defaultContextWindow: XAI_CONTEXT,
  },
  {
    id: "gemini-sub",
    // Not the subscription: this is Google's free Code Assist tier, the surface
    // the Gemini CLI uses. The paid Antigravity seat on the same account is
    // `antigravity-sub`, and the pay-as-you-go Google API is `gemini-api`, so
    // all three are named for what they actually bill.
    displayName: "Gemini Code Assist (Free tier)",
    kind: "subscription",
    authKind: "oauth",
    dialect: "code-assist",
    baseURL: "https://cloudcode-pa.googleapis.com/v1internal",
    authSlots: [TOKEN("GEMINI_SUB_OAUTH_TOKEN")],
    // loadCodeAssist answers 200 for an account whose generation quota is
    // exhausted, so probing it reported this route healthy while every
    // message came back 429. The smallest real generation is the only
    // request that answers the question the light claims to answer.
    probe: {
      url: "https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse",
      method: "POST",
      // The same identity headers the code-assist dialect sends per request;
      // Code Assist answers 500 rather than a status when they are absent.
      headers: {
        accept: "text/event-stream",
        "x-goog-api-client": "gl-node",
        "user-agent": "Antigravity/2.0.1 (Jetbrains; DARWIN_ARM64)",
      },
      body: JSON.stringify({
        model: "gemini-3.6-flash",
        project: "",
        user_prompt_id: "00000000-0000-4000-8000-000000000000",
        request: {
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
          generationConfig: { maxOutputTokens: 1 },
          session_id: "00000000-0000-4000-8000-000000000000",
        },
      }),
    },
    models: [
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash",
        contextWindow: GEMINI_CONTEXT,
        maxTokens: GEMINI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gemini-3.5-flash",
        name: "Gemini 3.5 Flash",
        contextWindow: GEMINI_CONTEXT,
        maxTokens: GEMINI_MAX_OUTPUT,
      },
      {
        id: "gemini-3.1-pro",
        name: "Gemini 3.1 Pro",
        contextWindow: GEMINI_CONTEXT,
        maxTokens: GEMINI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gemini-3-pro",
        name: "Gemini 3 Pro",
        contextWindow: GEMINI_CONTEXT,
        maxTokens: GEMINI_MAX_OUTPUT,
      },
    ],
    defaultMaxTokens: GEMINI_MAX_OUTPUT,
    defaultContextWindow: GEMINI_CONTEXT,
  },
  {
    id: "antigravity-sub",
    displayName: "Antigravity (Subscription)",
    kind: "subscription",
    authKind: "oauth",
    dialect: "antigravity",
    baseURL: "https://cloudcode-pa.googleapis.com/v1internal",
    // Same account and token as gemini-sub, a different product on it. The
    // Gemini/Google Cloud API reaches the same model families on a different
    // quota, which is why this is named for Antigravity rather than Gemini.
    authSlots: [
      TOKEN("GEMINI_SUB_OAUTH_TOKEN"),
      HEADER(ANTIGRAVITY_PROJECT_HEADER, "ANTIGRAVITY_PROJECT"),
    ],
    // The one request that exercises the subscription pool rather than the
    // free Code Assist tier gemini-sub is stuck behind.
    probe: {
      url: "https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota",
      method: "POST",
      body: "{}",
      headers: {
        "x-goog-api-client": "gl-node",
        "user-agent": "Antigravity/2.0.1 (Jetbrains; DARWIN_ARM64)",
      },
    },
    // The backend picks the model (see ANTIGRAVITY.md: every published
    // modelConfigId is refused), so the route advertises the one it serves.
    models: [
      {
        id: "gemini-3.7-flash",
        name: "Gemini 3.7 Flash",
        contextWindow: 1_048_576,
        maxTokens: 65_535,
        reasoning: EFFORTS,
      },
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash",
        contextWindow: 1_048_576,
        maxTokens: 65_535,
      },
      {
        id: "gemini-3.1-pro",
        name: "Gemini 3.1 Pro",
        contextWindow: 1_048_576,
        maxTokens: 65_535,
        reasoning: EFFORTS,
      },
    ],
    defaultMaxTokens: 65_535,
    defaultContextWindow: 1_048_576,
  },
  {
    id: "openai-api",
    displayName: "OpenAI (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://api.openai.com/v1",
    authSlots: [API_KEY("OPENAI_API_KEY")],
    catalog: { url: "https://api.openai.com/v1/models" },
    probe: { url: "https://api.openai.com/v1/models" },
    models: [
      {
        id: "gpt-5",
        name: "GPT-5",
        contextWindow: 400_000,
        maxTokens: OPENAI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      { id: "gpt-4.1", name: "GPT-4.1", contextWindow: 1_000_000, maxTokens: 32_000 },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o mini",
        contextWindow: OPENAI_DEFAULT_CONTEXT,
        maxTokens: 16_000,
      },
    ],
    defaultMaxTokens: 16_000,
    defaultContextWindow: OPENAI_DEFAULT_CONTEXT,
  },
  {
    id: "anthropic-api",
    displayName: "Anthropic (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "claude",
    baseURL: "https://api.anthropic.com/v1",
    authSlots: [API_KEY("ANTHROPIC_API_KEY")],
    catalog: { url: "https://api.anthropic.com/v1/models", authStyle: "x-api-key" },
    probe: { url: "https://api.anthropic.com/v1/models", authStyle: "x-api-key" },
    models: [
      {
        id: "claude-sonnet-4-5",
        name: "Claude Sonnet 4.5",
        contextWindow: CLAUDE_CONTEXT,
        maxTokens: CLAUDE_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "claude-opus-4-1",
        name: "Claude Opus 4.1",
        contextWindow: CLAUDE_CONTEXT,
        maxTokens: CLAUDE_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "claude-haiku-4-5",
        name: "Claude Haiku 4.5",
        contextWindow: 200_000,
        maxTokens: 64_000,
        reasoning: EFFORTS,
      },
    ],
    defaultMaxTokens: CLAUDE_MAX_OUTPUT,
    defaultContextWindow: CLAUDE_CONTEXT,
  },
  {
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
  },
  {
    id: "grok-api",
    displayName: "Grok (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://api.x.ai/v1",
    authSlots: [API_KEY("XAI_API_KEY")],
    catalog: { url: "https://api.x.ai/v1/models" },
    probe: { url: "https://api.x.ai/v1/models" },
    models: [
      {
        id: "grok-4",
        name: "Grok 4",
        contextWindow: XAI_CONTEXT,
        maxTokens: XAI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "grok-code-fast-1",
        name: "Grok Code Fast",
        contextWindow: XAI_CONTEXT,
        maxTokens: XAI_MAX_OUTPUT,
      },
    ],
    defaultMaxTokens: XAI_MAX_OUTPUT,
    defaultContextWindow: XAI_CONTEXT,
  },
  {
    id: "deepseek-api",
    displayName: "DeepSeek (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://api.deepseek.com/v1",
    authSlots: [API_KEY("DEEPSEEK_API_KEY")],
    catalog: { url: "https://api.deepseek.com/v1/models" },
    probe: { url: "https://api.deepseek.com/v1/models" },
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        contextWindow: DEEPSEEK_CONTEXT,
        maxTokens: DEEPSEEK_MAX_OUTPUT,
      },
      {
        id: "deepseek-reasoner",
        name: "DeepSeek Reasoner",
        contextWindow: DEEPSEEK_CONTEXT,
        maxTokens: DEEPSEEK_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
    ],
    defaultMaxTokens: DEEPSEEK_MAX_OUTPUT,
    defaultContextWindow: DEEPSEEK_CONTEXT,
  },
  {
    id: "mistral-api",
    displayName: "Mistral (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://api.mistral.ai/v1",
    authSlots: [API_KEY("MISTRAL_API_KEY")],
    catalog: { url: "https://api.mistral.ai/v1/models" },
    probe: { url: "https://api.mistral.ai/v1/models" },
    models: [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        contextWindow: MISTRAL_CONTEXT,
        maxTokens: MISTRAL_MAX_OUTPUT,
      },
      {
        id: "mistral-medium-latest",
        name: "Mistral Medium",
        contextWindow: MISTRAL_CONTEXT,
        maxTokens: MISTRAL_MAX_OUTPUT,
      },
    ],
    defaultMaxTokens: MISTRAL_MAX_OUTPUT,
    defaultContextWindow: MISTRAL_CONTEXT,
  },
  {
    id: "groq-api",
    displayName: "Groq (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://api.groq.com/openai/v1",
    authSlots: [API_KEY("GROQ_API_KEY")],
    catalog: { url: "https://api.groq.com/openai/v1/models" },
    probe: { url: "https://api.groq.com/openai/v1/models" },
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        contextWindow: GROQ_CONTEXT,
        maxTokens: GROQ_MAX_OUTPUT,
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B",
        contextWindow: GROQ_CONTEXT,
        maxTokens: GROQ_MAX_OUTPUT,
      },
    ],
    defaultMaxTokens: GROQ_MAX_OUTPUT,
    defaultContextWindow: GROQ_CONTEXT,
  },
  {
    id: "openrouter-api",
    displayName: "OpenRouter (API)",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://openrouter.ai/api/v1",
    authSlots: [API_KEY("OPENROUTER_API_KEY")],
    catalog: { url: "https://openrouter.ai/api/v1/models" },
    probe: { url: "https://openrouter.ai/api/v1/models" },
    models: [
      {
        id: "openai/gpt-4o",
        name: "OpenAI GPT-4o",
        contextWindow: OPENAI_DEFAULT_CONTEXT,
        maxTokens: 16_000,
      },
      {
        id: "anthropic/claude-sonnet-4.5",
        name: "Claude Sonnet 4.5",
        contextWindow: CLAUDE_CONTEXT,
        maxTokens: CLAUDE_MAX_OUTPUT,
      },
    ],
    defaultMaxTokens: 16_000,
    defaultContextWindow: OPENAI_DEFAULT_CONTEXT,
  },
  {
    id: "zen",
    displayName: "OpenCode Zen",
    kind: "api",
    authKind: "api-key",
    dialect: "openai",
    baseURL: "https://opencode.ai/zen/v1",
    authSlots: [API_KEY("ZEN_API_KEY")],
    catalog: { url: "https://opencode.ai/zen/v1/models" },
    // The listing answers 200 for a workspace with no payment method, while
    // every completion is refused — so probe with the smallest real completion.
    probe: {
      url: "https://opencode.ai/zen/v1/chat/completions",
      method: "POST",
      // A free-tier model: the route is usable without a funded workspace, and
      // probing a paid model would report the whole provider as unavailable
      // over a billing state that only affects part of its catalog.
      body: JSON.stringify({
        model: "deepseek-v4-flash-free",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    },
    models: [
      // OpenAI family — /v1/chat/completions (universal endpoint)
      {
        id: "gpt-5.6-sol",
        name: "GPT 5.6 Sol",
        contextWindow: 272_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gpt-5.6-terra",
        name: "GPT 5.6 Terra",
        contextWindow: 272_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gpt-5.6-luna",
        name: "GPT 5.6 Luna",
        contextWindow: 272_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gpt-5.5",
        name: "GPT 5.5",
        contextWindow: 272_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gpt-5.4",
        name: "GPT 5.4",
        contextWindow: 272_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gpt-5.3-codex",
        name: "GPT 5.3 Codex",
        contextWindow: 272_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      // Claude family
      {
        id: "claude-opus-5",
        name: "Claude Opus 5",
        contextWindow: ZEN_CLAUDE_CONTEXT,
        maxTokens: ZEN_CLAUDE_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "claude-opus-4-8",
        name: "Claude Opus 4.8",
        contextWindow: ZEN_CLAUDE_CONTEXT,
        maxTokens: ZEN_CLAUDE_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "claude-sonnet-5",
        name: "Claude Sonnet 5",
        contextWindow: ZEN_CLAUDE_CONTEXT,
        maxTokens: ZEN_CLAUDE_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        contextWindow: ZEN_CLAUDE_CONTEXT,
        maxTokens: ZEN_CLAUDE_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "claude-haiku-4-5",
        name: "Claude Haiku 4.5",
        contextWindow: 200_000,
        maxTokens: 64_000,
        reasoning: EFFORTS,
      },
      // Gemini family
      {
        id: "gemini-3.7-flash",
        name: "Gemini 3.7 Flash",
        contextWindow: GEMINI_CONTEXT,
        maxTokens: GEMINI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash",
        contextWindow: GEMINI_CONTEXT,
        maxTokens: GEMINI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "gemini-3.1-pro",
        name: "Gemini 3.1 Pro",
        contextWindow: GEMINI_CONTEXT,
        maxTokens: GEMINI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      // Grok family
      {
        id: "grok-4.6",
        name: "Grok 4.6",
        contextWindow: 200_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "grok-4.5",
        name: "Grok 4.5",
        contextWindow: 200_000,
        maxTokens: ZEN_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      // DeepSeek family
      {
        id: "deepseek-v4-pro",
        name: "DeepSeek V4 Pro",
        contextWindow: DEEPSEEK_CONTEXT,
        maxTokens: DEEPSEEK_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "deepseek-v4-flash",
        name: "DeepSeek V4 Flash",
        contextWindow: DEEPSEEK_CONTEXT,
        maxTokens: DEEPSEEK_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      // Kimi family
      {
        id: "kimi-k3",
        name: "Kimi K3",
        contextWindow: KIMI_K3_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      {
        id: "kimi-k2.7-code",
        name: "Kimi K2.7 Code",
        contextWindow: KIMI_CONTEXT,
        maxTokens: KIMI_MAX_OUTPUT,
        reasoning: EFFORTS,
      },
      // Qwen family
      {
        id: "qwen3.7-max",
        name: "Qwen 3.7 Max",
        contextWindow: ZEN_CONTEXT,
        maxTokens: ZEN_MAX_OUTPUT,
      },
      {
        id: "qwen3.7-plus",
        name: "Qwen 3.7 Plus",
        contextWindow: ZEN_CONTEXT,
        maxTokens: ZEN_MAX_OUTPUT,
      },
      // Free tier
      {
        id: "deepseek-v4-flash-free",
        name: "DeepSeek V4 Flash (Free)",
        contextWindow: DEEPSEEK_CONTEXT,
        maxTokens: DEEPSEEK_MAX_OUTPUT,
      },
      {
        id: "mimo-v2.5-free",
        name: "MiMo-V2.5 (Free)",
        contextWindow: ZEN_CONTEXT,
        maxTokens: ZEN_MAX_OUTPUT,
      },
    ],
    defaultMaxTokens: ZEN_MAX_OUTPUT,
    defaultContextWindow: ZEN_CONTEXT,
  },

  // ---- Local inference (no auth, no quota, always available) ----
  {
    id: "ollama",
    displayName: "Ollama (Local)",
    kind: "local",
    authKind: "none",
    dialect: "openai",
    baseURL: "http://127.0.0.1:11434/v1",
    authSlots: [],
    catalog: { url: "http://127.0.0.1:11434/v1/models" },
    probe: { url: "http://127.0.0.1:11434/api/tags" },
    models: [
      { id: "qwen3.8:27b", name: "Qwen 3.8 27B", contextWindow: 131_072, maxTokens: 16_384 },
    ],
    defaultMaxTokens: 16_384,
    defaultContextWindow: 131_072,
  },
  {
    id: "llamacpp",
    displayName: "llama.cpp (Local)",
    kind: "local",
    authKind: "none",
    dialect: "openai",
    baseURL: "http://127.0.0.1:8080/v1",
    authSlots: [],
    catalog: { url: "http://127.0.0.1:8080/v1/models" },
    probe: { url: "http://127.0.0.1:8080/v1/models" },
    models: [],
    defaultMaxTokens: 16_384,
    defaultContextWindow: 131_072,
  },
  {
    id: "vllm",
    displayName: "vLLM (Local)",
    kind: "local",
    authKind: "none",
    dialect: "openai",
    baseURL: "http://127.0.0.1:8000/v1",
    authSlots: [],
    catalog: { url: "http://127.0.0.1:8000/v1/models" },
    probe: { url: "http://127.0.0.1:8000/v1/models" },
    models: [],
    defaultMaxTokens: 16_384,
    defaultContextWindow: 131_072,
  },
];

/** Every registered provider id, in declaration order. */
export const PROVIDER_IDS: readonly string[] = PROVIDER_ROUTES.map((route) => route.id);

const BY_ID = new Map(PROVIDER_ROUTES.map((route) => [route.id, route]));

/** Look up a route by id; throws on unknown ids. */
export function providerRoute(id: string): ProviderRoute {
  const route = BY_ID.get(id);
  if (route === undefined) throw new Error(`providers: unknown provider route "${id}"`);
  return route;
}
