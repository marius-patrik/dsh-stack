// jscpd:ignore-start -- per-provider-route verification scaffolding repeated per route within this single check-plugin.mjs
import * as providers from "./lib/index.js";
import * as dialects from "@dsh-stack/dialects";
import { Context } from "@deepseek-ai/cordis";
import { LlmError } from "@deepseek-ai/dsh-llm";
import assert from "node:assert";
import { assertLoaderShape } from "../../scripts/plugin-check-kit.mjs";

// Every route now lives in its own `@dsh-stack/provider-<id>` extension (see
// extensions/provider-<id>); this package only owns the registry and dispatch
// mechanics. Loaded here by relative path (not a package.json dependency —
// that would invert the real ownership direction, the plugin does not depend
// on its extensions) purely so this contract test can exercise the same 18
// routes real deployments assemble, the way the split shipped them.
const EXTENSION_IDS = [
  "kimi-code",
  "kimi-sub",
  "claude-sub",
  "grok-sub",
  "gemini-sub",
  "antigravity-sub",
  "openai-api",
  "anthropic-api",
  "gemini-api",
  "grok-api",
  "deepseek-api",
  "mistral-api",
  "groq-api",
  "openrouter-api",
  "zen",
  "ollama",
  "llamacpp",
  "vllm",
];
const extensions = new Map(
  await Promise.all(
    EXTENSION_IDS.map(async (id) => [
      id,
      await import(`../../extensions/provider-${id}/lib/index.js`),
    ]),
  ),
);

/** Apply the providers plugin, then every provider extension's route registration. */
function applyProviders(ctx, config) {
  providers.apply(ctx, config);
  for (const extension of extensions.values()) extension.apply(ctx);
}

assertLoaderShape(providers, "providers");

console.log("loader shape ok:", providers.name, "inject=", JSON.stringify(providers.inject));

const ctx = new Context();
dialects.apply(ctx, {});

const llm = {
  configurable: [],
  adapter: undefined,
  registeredProviders: undefined,
  /** registerConfigurableProviders implementation. */
  registerConfigurableProviders(entries) {
    this.configurable = [...entries];
    const self = this;
    /** handle implementation. */
    const handle = () => {};
    handle.replace = (next) => {
      self.configurable = [...next];
    };
    return handle;
  },
  /** registerAdapter implementation. */
  registerAdapter(registered, adapter) {
    this.adapter = adapter;
    this.registeredProviders = [...registered];
    const self = this;
    /** handle implementation. */
    const handle = () => {};
    handle.replace = (next) => {
      self.registeredProviders = [...next];
    };
    handle.dispose = () => {};
    return handle;
  },
};
ctx.provide("llm", llm);
const settings = {
  /** register implementation. */
  register(_ns, _schema, opts) {
    return { get: () => opts.base, watch: () => undefined };
  },
};
ctx.provide("settings", settings);
const credentialsMin = {
  /** resolve implementation. */
  async resolve(ref) {
    if (ref === "CLAUDE_SUB_OAUTH_TOKEN") return { value: "test-oauth-token", source: "test" };
    if (ref === "OPENAI_API_KEY") return { value: "test-openai-key", source: "test" };
    return undefined;
  },
};
ctx.provide("credentials", credentialsMin);

applyProviders(ctx, { liveCatalog: false });
assert.deepEqual(
  llm.configurable.map((p) => p.provider),
  EXTENSION_IDS,
);
assert.deepEqual(llm.registeredProviders, EXTENSION_IDS);
console.log(
  "registration ok:",
  llm.configurable.map((p) => `${p.provider}=${p.displayName}`).join(", "),
);

// The policy service is the single gate source of truth.
assert.ok(ctx.dshProviders instanceof providers.ProviderPolicy);
assert.ok((await ctx.dshProviders.gate("kimi-code"))?.reason.code === "PROVIDER_DISABLED");
assert.ok((await ctx.dshProviders.gate("openai-api"))?.reason.code === "PROVIDER_DISABLED");
assert.equal(await ctx.dshProviders.gate("claude-sub"), undefined);
assert.ok((await ctx.dshProviders.gate("grok-sub"))?.reason.code === "MISSING_CREDENTIAL");
// Providers the plugin does not own (deepseek-official, ...) are offered as-is.
assert.equal(await ctx.dshProviders.gate("deepseek-official"), undefined);
console.log("provider policy service ok");

// Default mode is subscription-only: billable API routes are hidden from the
// catalog and refused everywhere; subscriptions must be logged in.
const adapter = llm.adapter;
const hidden = await adapter.listModels("kimi-code");
assert.deepEqual(hidden, []);
let disabledRejected = false;
try {
  await adapter.resolveModel("kimi-code", "kimi-k2.5");
} catch (error) {
  assert.ok(error instanceof LlmError);
  assert.equal(error.code, "PROVIDER_DISABLED");
  disabledRejected = true;
}
assert.ok(disabledRejected, "disabled provider was not refused at selection");
let disabledStreamRejected = false;
try {
  for await (const _chunk of adapter.stream({
    provider: "kimi-code",
    model: "kimi-k2.5",
    messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
  }))
    void _chunk;
} catch (error) {
  assert.ok(error instanceof LlmError);
  assert.equal(error.code, "PROVIDER_DISABLED");
  disabledStreamRejected = true;
}
assert.ok(disabledStreamRejected, "disabled provider was not refused at dispatch");
// A subscription with no stored login leaves the selector rather than
// appearing as a "failed to load" row; the quotas panel is where its status
// is reported. Dispatch still refuses it with the reason.
assert.deepEqual(await adapter.listModels("grok-sub"), []);
await assert.rejects(() => adapter.resolveModel("grok-sub", "grok-4.6"), {
  code: "MISSING_CREDENTIAL",
});
const models = await adapter.listModels("claude-sub");
assert.ok(models.some((m) => m.id === "claude-sonnet-5"));
assert.ok(!ctx.providers.has("cursor-sub"), "cursor-sub must be dropped");
const resolved = await adapter.resolveModel("claude-sub", "claude-sonnet-5");
assert.equal(resolved.defaultMaxTokens, 128_000);
console.log(
  "subscription-only filter ok: kimi-code hidden, grok-sub hidden without a login, claude-sub usable",
);

// mode "all" restores every route: uncatalogued models resolve, and a missing
// key surfaces on the request as MISSING_CREDENTIAL instead of at the filter.
const ctxAll = new Context();
dialects.apply(ctxAll, {});
const llmAll = {
  configurable: [],
  adapter: undefined,
  registeredProviders: undefined,
  /** registerConfigurableProviders implementation. */
  registerConfigurableProviders(entries) {
    this.configurable = [...entries];
    const self = this;
    /** handle implementation. */
    const handle = () => {};
    handle.replace = (next) => {
      self.configurable = [...next];
    };
    return handle;
  },
  /** registerAdapter implementation. */
  registerAdapter(registered, adapter) {
    this.adapter = adapter;
    this.registeredProviders = [...registered];
    const self = this;
    /** handle implementation. */
    const handle = () => {};
    handle.replace = (next) => {
      self.registeredProviders = [...next];
    };
    handle.dispose = () => {};
    return handle;
  },
};
ctxAll.provide("llm", llmAll);
ctxAll.provide("settings", settings);
const credentialsFull = {
  /** resolve implementation. */
  async resolve(ref) {
    if (ref === "CLAUDE_SUB_OAUTH_TOKEN") return { value: "test-oauth-token", source: "test" };
    if (ref === "GROK_SUB_OAUTH_TOKEN") return { value: "test-grok-token", source: "test" };
    if (ref === "GEMINI_SUB_OAUTH_TOKEN") return { value: "test-gemini-token", source: "test" };
    if (ref === "OPENAI_API_KEY") return { value: "test-openai-key", source: "test" };
    if (ref.endsWith("_API_KEY")) return { value: `test-${ref.toLowerCase()}`, source: "test" };
    return undefined;
  },
};
ctxAll.provide("credentials", credentialsFull);
applyProviders(ctxAll, { mode: "all", liveCatalog: false });
// mode "all" lifts the pay-as-you-go block for a credentialed route.
assert.equal(await ctxAll.dshProviders.gate("kimi-code"), undefined);
const openAdapter = llmAll.adapter;
const unknown = await openAdapter.resolveModel("kimi-code", "never-seen");
assert.equal(unknown.defaultMaxTokens, 256_000);
console.log(
  "catalog ok (all mode):",
  (await openAdapter.listModels("claude-sub")).map((m) => m.id).join(", "),
);

// Full stream path: real claude dialect serialize -> fetch -> parse -> translate.
const sseBody = [
  "event: message_start",
  'data: {"type":"message_start","message":{"id":"msg_1","model":"claude-sonnet-4-5","usage":{"input_tokens":3,"output_tokens":1}}}',
  "",
  "event: content_block_start",
  'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}',
  "",
  "event: content_block_delta",
  'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Hello "}}',
  "",
  "event: content_block_delta",
  'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"world"}}',
  "",
  "event: content_block_stop",
  'data: {"type":"content_block_stop","index":0}',
  "",
  "event: message_delta",
  'data: {"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":{"output_tokens":2}}',
  "",
  "event: message_stop",
  'data: {"type":"message_stop"}',
  "",
].join("\n");

let capturedUrl;
let capturedAuth;
globalThis.fetch = async (url, init) => {
  capturedUrl = url;
  capturedAuth = init.headers["authorization"];
  return new Response(
    new ReadableStream({
      /** start implementation. */
      start(controller) {
        controller.enqueue(new TextEncoder().encode(sseBody));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
};

const chunks = [];
for await (const chunk of openAdapter.stream({
  provider: "claude-sub",
  model: "claude-sonnet-5",
  messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
})) {
  chunks.push(chunk);
}
assert.equal(capturedUrl, "https://api.anthropic.com/v1/messages");
assert.equal(capturedAuth, "Bearer test-oauth-token");
const text = chunks.map((c) => c.block?.text ?? c.delta?.text ?? "").join("");
assert.ok(text.includes("Hello world"), `unexpected assembled text: ${JSON.stringify(text)}`);
const usage = chunks.find((c) => c.usage !== undefined);
assert.ok(usage, "no usage chunk");
console.log(
  "claude-sub stream ok:",
  JSON.stringify({ url: capturedUrl, text, usage: usage.usage }),
);

// New API-key routes speak the openai dialect: api.openai.com/v1 base plus a
// Bearer apiKey resolves through the account seam under mode "all".
const openaiBody = [
  'data: {"id":"chatcmpl_1","object":"chat.completion.chunk","model":"gpt-5","choices":[{"index":0,"delta":{"role":"assistant","content":""}}]}',
  "",
  'data: {"id":"chatcmpl_1","object":"chat.completion.chunk","model":"gpt-5","choices":[{"index":0,"delta":{"content":"Hello "}}]}',
  "",
  'data: {"id":"chatcmpl_1","object":"chat.completion.chunk","model":"gpt-5","choices":[{"index":0,"delta":{"content":"world"}}]}',
  "",
  'data: {"id":"chatcmpl_1","object":"chat.completion.chunk","model":"gpt-5","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}',
  "",
  "data: [DONE]",
  "",
  "",
].join("\n");
globalThis.fetch = async (url, init) => {
  capturedUrl = url;
  capturedAuth = init.headers["authorization"];
  return new Response(
    new ReadableStream({
      /** start implementation. */
      start(controller) {
        controller.enqueue(new TextEncoder().encode(openaiBody));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
};
const openaiChunks = [];
for await (const chunk of openAdapter.stream({
  provider: "openai-api",
  model: "gpt-5",
  messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
})) {
  openaiChunks.push(chunk);
}
assert.equal(capturedUrl, "https://api.openai.com/v1/chat/completions");
assert.equal(capturedAuth, "Bearer test-openai-key");
const openaiText = openaiChunks.map((c) => c.block?.text ?? c.delta?.text ?? "").join("");
assert.ok(
  openaiText.includes("Hello world"),
  `unexpected assembled text: ${JSON.stringify(openaiText)}`,
);
console.log("openai-api stream ok:", JSON.stringify({ url: capturedUrl, text: openaiText }));

// Proxy routes (openrouter) advertise their catalog in all mode.
const proxyModels = await openAdapter.listModels("openrouter-api");
assert.ok(proxyModels.some((m) => m.id === "openai/gpt-4o"));
console.log("openrouter-api catalog ok:", proxyModels.map((m) => m.id).join(", "));

// OpenCode Zen route: api-key auth, openai dialect, 24+ models in catalog.
const zenModels = await openAdapter.listModels("zen");
assert.ok(zenModels.length >= 20, `zen catalog too small: ${zenModels.length}`);
assert.ok(zenModels.some((m) => m.id === "gpt-5.5"));
assert.ok(zenModels.some((m) => m.id === "claude-opus-5"));
assert.ok(zenModels.some((m) => m.id === "deepseek-v4-flash-free"));
const zenResolved = await openAdapter.resolveModel("zen", "gpt-5.5");
assert.equal(zenResolved.defaultMaxTokens, 64_000);
console.log("zen catalog ok:", zenModels.map((m) => m.id).join(", "));

// zen stream: openai dialect against opencode.ai/zen/v1/chat/completions.
globalThis.fetch = async (url, init) => {
  capturedUrl = url;
  capturedAuth = init.headers["authorization"];
  return new Response(
    new ReadableStream({
      /** start implementation. */
      start(controller) {
        controller.enqueue(new TextEncoder().encode(openaiBody));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
};
// Provide ZEN_API_KEY for the stream test — update the existing resolver
const zenCreds = {
  /** resolve implementation. */
  async resolve(ref) {
    if (ref === "CLAUDE_SUB_OAUTH_TOKEN") return { value: "test-oauth-token", source: "test" };
    if (ref === "GROK_SUB_OAUTH_TOKEN") return { value: "test-grok-token", source: "test" };
    if (ref === "GEMINI_SUB_OAUTH_TOKEN") return { value: "test-gemini-token", source: "test" };
    if (ref === "OPENAI_API_KEY") return { value: "test-openai-key", source: "test" };
    if (ref === "ZEN_API_KEY") return { value: "test-zen-key", source: "test" };
    return undefined;
  },
};
// Cannot re-provide credentials; override the existing object's resolve
Object.assign(credentialsFull, zenCreds);
const zenChunks = [];
for await (const chunk of openAdapter.stream({
  provider: "zen",
  model: "gpt-5.5",
  messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
})) {
  zenChunks.push(chunk);
}
assert.equal(capturedUrl, "https://opencode.ai/zen/v1/chat/completions");
assert.equal(capturedAuth, "Bearer test-zen-key");
const zenText = zenChunks.map((c) => c.block?.text ?? c.delta?.text ?? "").join("");
assert.ok(zenText.includes("Hello world"), `unexpected zen text: ${JSON.stringify(zenText)}`);
console.log("zen stream ok:", JSON.stringify({ url: capturedUrl, text: zenText }));

// Missing credential path under mode "all": the request fails at auth time.
const missing = openAdapter.stream({
  provider: "kimi-code",
  model: "kimi-k2.5",
  messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
});
let rejected = false;
try {
  for await (const _chunk of missing) void _chunk;
} catch (error) {
  assert.ok(error instanceof LlmError);
  assert.equal(error.code, "MISSING_CREDENTIAL");
  rejected = true;
}
assert.ok(rejected, "missing credential was not rejected");
console.log("missing-credential path ok");

// grok-sub speaks openai against cli-chat-proxy with the identity headers.
let capturedInit;
globalThis.fetch = async (url, init) => {
  capturedUrl = url;
  capturedInit = init;
  return new Response(
    new ReadableStream({
      /** start implementation. */
      start(controller) {
        controller.enqueue(new TextEncoder().encode(openaiBody));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
};
const grokChunks = [];
for await (const chunk of openAdapter.stream({
  provider: "grok-sub",
  model: "grok-4.6",
  messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
})) {
  grokChunks.push(chunk);
}
assert.equal(capturedUrl, "https://cli-chat-proxy.grok.com/v1/chat/completions");
assert.equal(capturedInit.headers["authorization"], "Bearer test-grok-token");
assert.equal(capturedInit.headers["x-xai-token-auth"], "xai-grok-cli");
assert.equal(capturedInit.headers["x-grok-client-identifier"], "grok-shell");
assert.equal(capturedInit.headers["x-grok-client-version"], "0.2.93");
const grokText = grokChunks.map((c) => c.block?.text ?? c.delta?.text ?? "").join("");
assert.ok(grokText.includes("Hello world"), `unexpected grok text: ${JSON.stringify(grokText)}`);
console.log("grok-sub stream ok:", JSON.stringify({ url: capturedUrl, text: grokText }));

// gemini-sub speaks code-assist: v1internal endpoint, OAuth bearer, wrapped body.
const assistBody = [
  'data: {"traceId":"t1","response":{"candidates":[{"content":{"role":"model","parts":[{"text":"Hello "}]}}]}}',
  "",
  'data: {"traceId":"t2","response":{"candidates":[{"content":{"role":"model","parts":[{"text":"Hello world"}]}}],"usageMetadata":{"promptTokenCount":3,"candidatesTokenCount":2}}}',
  "",
  'data: {"traceId":"t3","response":{"candidates":[{"content":{"role":"model","parts":[{"text":"Hello world"}]},"finishReason":"STOP"}]}}',
  "",
  "",
].join("\n");
globalThis.fetch = async (url, init) => {
  capturedUrl = url;
  capturedInit = init;
  return new Response(
    new ReadableStream({
      /** start implementation. */
      start(controller) {
        controller.enqueue(new TextEncoder().encode(assistBody));
        controller.close();
      },
    }),
    { status: 200, headers: { "content-type": "text/event-stream" } },
  );
};
const geminiChunks = [];
for await (const chunk of openAdapter.stream({
  provider: "gemini-sub",
  model: "gemini-3.6-flash",
  messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
})) {
  geminiChunks.push(chunk);
}
assert.equal(
  capturedUrl,
  "https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse",
);
assert.equal(capturedInit.headers["authorization"], "Bearer test-gemini-token");
const wrapped = JSON.parse(capturedInit.body);
assert.equal(wrapped.model, "gemini-3.6-flash");
assert.equal(wrapped.project, "");
assert.equal(wrapped.user_prompt_id.length, 36);
assert.equal(wrapped.request.session_id.length, 36);
assert.deepEqual(wrapped.request.contents, [{ role: "user", parts: [{ text: "hi" }] }]);
const geminiText = geminiChunks.map((c) => c.block?.text ?? c.delta?.text ?? "").join("");
assert.ok(
  geminiText.includes("Hello world"),
  `unexpected gemini text: ${JSON.stringify(geminiText)}`,
);
const geminiUsage = geminiChunks.find((c) => c.usage !== undefined);
assert.ok(geminiUsage, "no gemini usage chunk");
console.log(
  "gemini-sub stream ok:",
  JSON.stringify({ url: capturedUrl, text: geminiText, usage: geminiUsage.usage }),
);
// An exhausted plan answers 403 with quota wording. It must classify as
// QUOTA_EXCEEDED, not AUTH: the client renders AUTH as "API key is invalid",
// which sent the operator re-running device login against a working token.
const kimiQuotaDetail =
  "access_terminated_error You've reached your usage limit for this" +
  " billing cycle. Your quota will be refreshed in the next cycle.";
assert.equal(providers.httpErrorCode(403, kimiQuotaDetail), "QUOTA");
assert.equal(
  providers.httpErrorCode(403, "insufficient_quota You exceeded your current quota"),
  "QUOTA",
);
// A 403 without quota wording is still an auth failure, and 401 always is.
assert.equal(providers.httpErrorCode(403, "permission_error not allowed for this key"), "AUTH");
assert.equal(providers.httpErrorCode(403, undefined), "AUTH");
// A funding problem answered as 401 is still a funding problem: Zen returns
// 401 CreditsError about a key that authenticates.
assert.equal(
  providers.httpErrorCode(
    401,
    "CreditsError No payment method. Add a payment method here: https://…",
  ),
  "QUOTA",
);
// A 401 that really is about the credential stays AUTH.
assert.equal(providers.httpErrorCode(401, "invalid_api_key the provided key is not valid"), "AUTH");
assert.equal(providers.httpErrorCode(401, undefined), "AUTH");
assert.equal(providers.httpErrorCode(429, "slow down"), "RATE_LIMIT");
console.log("403 quota classification ok");

// A provider message that says nothing must not become the whole failure
// reason: Anthropic answers a subscription rate limit with message "Error".
{
  const { describeHttpFailure } = providers;
  const rateLimited = describeHttpFailure(429, "claude-sub", 30_000);
  assert.match(rateLimited, /claude-sub/);
  assert.match(rateLimited, /rate limited/i);
  assert.match(rateLimited, /Retry in about 30s/);
  assert.match(describeHttpFailure(429, "claude-sub", undefined), /limit for this/);
  assert.match(describeHttpFailure(401, "kimi-code", undefined), /refused this credential/);
  assert.match(describeHttpFailure(503, "gemini-sub", undefined), /internal error/);
  assert.match(describeHttpFailure(418, "zen", undefined), /HTTP 418/);
  console.log("uninformative-failure copy ok");
}

// ---- the credential gate keeps unusable rows out of the selector ----
{
  const ctxBare = new Context();
  dialects.apply(ctxBare, {});
  const llmBare = {
    configurable: [],
    adapter: undefined,
    /** registerConfigurableProviders implementation. */
    registerConfigurableProviders() {},
    /** registerAdapter implementation. */
    registerAdapter(registered, adapter) {
      this.adapter = adapter;
      /** handle implementation. */
      const handle = () => {};
      handle.replace = () => {};
      handle.dispose = () => {};
      return handle;
    },
  };
  ctxBare.provide("llm", llmBare);
  ctxBare.provide("settings", settings);
  // Nothing is configured: every route is uncredentialed.
  ctxBare.provide("credentials", {
    /** resolve implementation. */
    async resolve() {
      return undefined;
    },
  });
  applyProviders(ctxBare, { mode: "all", liveCatalog: false });

  // Nothing configured: every route leaves the selector silently. The host
  // hides a provider whose gate is invisible, so no "failed to load" row is
  // produced for a provider the user has no account with.
  for (const provider of ["kimi-code", "kimi-sub", "openai-api", "zen"]) {
    const gate = await ctxBare.dshProviders.gate(provider);
    assert.equal(gate?.visible, false, `${provider} was never configured and must be hidden`);
    assert.equal(gate?.reason.code, "MISSING_CREDENTIAL");
    assert.deepEqual(
      await ctxBare.llm.adapter.listModels(provider),
      [],
      `${provider} must list nothing`,
    );
    await assert.rejects(() => ctxBare.llm.adapter.resolveModel(provider, "anything"), {
      code: "MISSING_CREDENTIAL",
    });
  }

  // A subscription whose stored login no longer resolves is the one case that
  // must be surfaced: the record exists, so the user has to act on it.
  const ctxStale = new Context();
  dialects.apply(ctxStale, {});
  const llmStale = {
    configurable: [],
    adapter: undefined,
    /** registerConfigurableProviders implementation. */
    registerConfigurableProviders() {},
    /** registerAdapter implementation. */
    registerAdapter(registered, adapter) {
      this.adapter = adapter;
      /** handle implementation. */
      const handle = () => {};
      handle.replace = () => {};
      handle.dispose = () => {};
      return handle;
    },
  };
  ctxStale.provide("llm", llmStale);
  ctxStale.provide("settings", settings);
  // The dead-refresh-grant shape: an expired access token still on disk, a
  // refresh token the provider has already consumed, and an expiry in the past
  // so a refresh is attempted.
  ctxStale.provide("accounts", {
    /** resolve implementation. */
    async resolve(ref) {
      if (ref === "CLAUDE_SUB_OAUTH_TOKEN") return { value: "stored-but-expired", source: "test" };
      if (ref === "CLAUDE_SUB_REFRESH_TOKEN") return { value: "consumed-refresh", source: "test" };
      if (ref === "CLAUDE_SUB_EXPIRES") return { value: "1", source: "test" };
      return undefined;
    },
    /** set implementation. */
    async set() {},
    /** accounts implementation. */
    async accounts() {
      return [];
    },
  });
  applyProviders(ctxStale, { mode: "all", liveCatalog: false });

  // 400 on a refresh grant is invalid_grant: permanent, so the stored access
  // token stops resolving while the record itself stays on disk.
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    if (String(url).includes("/oauth/token"))
      return new Response('{"error":"invalid_grant"}', { status: 400 });
    throw new Error(`unexpected fetch in stale-credential test: ${String(url)}`);
  };
  try {
    // Both leave the selector, but the reason distinguishes them: only a stale
    // login is something the user can act on.
    const staleGate = await ctxStale.dshProviders.gate("claude-sub");
    assert.equal(staleGate?.visible, false, "an unusable route must not become a failure row");
    assert.match(staleGate?.reason.message ?? "", /no longer valid/);
    assert.match(staleGate?.reason.message ?? "", /sign in again/);
    const neverGate = await ctxStale.dshProviders.gate("openai-api");
    assert.equal(neverGate?.visible, false);
    assert.match(neverGate?.reason.message ?? "", /no credential for/);
  } finally {
    globalThis.fetch = realFetch;
  }

  console.log("credential gate ok: unusable routes leave the selector, stale ones say why");
}

// ---- the effort changer ----
{
  // The harness carries LlmResolvedModelInfo.reasoning to the model picker, so
  // declaring efforts here is what makes the changer appear for a dsh route.
  const resolved = await openAdapter.resolveModel("claude-sub", "claude-opus-5");
  assert.deepEqual(
    resolved.reasoning?.efforts.map((e) => e.id),
    ["low", "medium", "high"],
  );
  assert.equal(resolved.reasoning?.defaultEffort, "medium");
  // A model without reasoning must not advertise a changer.
  assert.equal((await openAdapter.resolveModel("openai-api", "gpt-4o-mini")).reasoning, undefined);
  console.log("effort ladder reaches the picker");
}

// ---- live model discovery ----
{
  const { ModelCatalog, mergeCatalog, parseCatalogResponse } = providers;

  // Every published spelling of the window size is read; rows without an id are dropped.
  assert.deepEqual(
    parseCatalogResponse({
      data: [
        { id: "a", display_name: "A", context_length: 262144 },
        { id: "b", name: "B", context_window: 1000 },
        { id: "c", top_provider: { context_length: 500, max_completion_tokens: 50 } },
        { object: "model" },
      ],
    }),
    [
      { id: "a", name: "A", contextWindow: 262144 },
      { id: "b", name: "B", contextWindow: 1000 },
      { id: "c", contextWindow: 500, maxTokens: 50 },
    ],
  );
  assert.equal(parseCatalogResponse({ data: [] }), undefined);
  assert.equal(parseCatalogResponse({ error: "nope" }), undefined);
  assert.equal(parseCatalogResponse("not json"), undefined);

  // Discovered facts win; static rows fill the gaps and unlisted aliases survive.
  const merged = mergeCatalog(
    [{ id: "live-new", contextWindow: 900 }, { id: "known" }],
    [
      { id: "known", name: "Known", contextWindow: 111, maxTokens: 22 },
      { id: "alias", name: "Alias", contextWindow: 333, maxTokens: 44 },
    ],
    { contextWindow: 128_000, maxTokens: 8_000 },
  );
  assert.deepEqual(merged, [
    { id: "live-new", name: "live-new", contextWindow: 900, maxTokens: 8_000 },
    { id: "known", name: "Known", contextWindow: 111, maxTokens: 22 },
    { id: "alias", name: "Alias", contextWindow: 333, maxTokens: 44 },
  ]);

  const request = {
    source: { url: "https://example.test/v1/models" },
    token: "test-token",
    fallback: [{ id: "static-only", name: "Static", contextWindow: 10, maxTokens: 5 }],
    defaults: { contextWindow: 128_000, maxTokens: 8_000 },
  };

  // A concurrent burst of selector reads makes exactly one request.
  let calls = 0;
  let seenAuth;
  const okCatalog = new ModelCatalog({
    fetch: async (url, init) => {
      calls += 1;
      seenAuth = init.headers["authorization"];
      return new Response(JSON.stringify({ data: [{ id: "fresh-model", context_length: 42 }] }), {
        status: 200,
      });
    },
  });
  const [first, second] = await Promise.all([
    okCatalog.models("p", request),
    okCatalog.models("p", request),
  ]);
  assert.equal(calls, 1);
  assert.equal(seenAuth, "Bearer test-token");
  assert.deepEqual(
    first.map((m) => m.id),
    ["fresh-model", "static-only"],
  );
  assert.deepEqual(second, first);
  assert.deepEqual(
    (await okCatalog.models("p", request)).map((m) => m.id),
    ["fresh-model", "static-only"],
  );
  assert.equal(calls, 1, "a cached listing must not refetch inside the TTL");
  okCatalog.clear();
  await okCatalog.models("p", request);
  assert.equal(calls, 2, "clear() must force a refetch");

  // A refused listing degrades to the static table rather than failing the selector.
  const refused = new ModelCatalog({ fetch: async () => new Response("nope", { status: 403 }) });
  assert.deepEqual(
    (await refused.models("p", request)).map((m) => m.id),
    ["static-only"],
  );
  const offline = new ModelCatalog({
    fetch: async () => {
      throw new Error("offline");
    },
  });
  assert.deepEqual(
    (await offline.models("p", request)).map((m) => m.id),
    ["static-only"],
  );

  // x-api-key routes send the Anthropic headers, query routes put the key in the URL.
  let anthropicHeaders;
  const anthropic = new ModelCatalog({
    fetch: async (url, init) => {
      anthropicHeaders = init.headers;
      return new Response(JSON.stringify({ data: [{ id: "claude-x" }] }), { status: 200 });
    },
  });
  await anthropic.models("a", {
    ...request,
    source: { url: "https://example.test/v1/models", authStyle: "x-api-key" },
  });
  assert.equal(anthropicHeaders["x-api-key"], "test-token");
  assert.equal(anthropicHeaders["anthropic-version"], "2023-06-01");
  assert.equal(anthropicHeaders["authorization"], undefined);

  let queryUrl;
  const queryAuth = new ModelCatalog({
    fetch: async (url) => {
      queryUrl = url;
      return new Response(JSON.stringify({ data: [{ id: "gemini-x" }] }), { status: 200 });
    },
  });
  await queryAuth.models("g", {
    ...request,
    source: { url: "https://example.test/v1beta/models", authStyle: "query" },
  });
  assert.equal(new URL(queryUrl).searchParams.get("key"), "test-token");

  // A declared effort ladder must survive discovery: listings never publish it,
  // so the static row is the only source and dropping it would remove the effort
  // changer from the picker the moment discovery came online.
  const withEfforts = mergeCatalog(
    [{ id: "known" }],
    [
      {
        id: "known",
        name: "Known",
        contextWindow: 1,
        maxTokens: 1,
        reasoning: { efforts: [{ id: "high", name: "High" }] },
      },
    ],
    { contextWindow: 2, maxTokens: 2 },
  );
  assert.deepEqual(withEfforts[0].reasoning, { efforts: [{ id: "high", name: "High" }] });

  console.log("live model discovery ok");
}

// ---- status lights for providers this plugin does not own ----
{
  const { createConfiguredProviders, probeConfiguredRoute, readConfiguredProfile, modelsEndpoint } =
    providers;
  const PROBE_ROUTE_IDS = [...ctx.providers.list()]
    .filter((route) => route.probe !== undefined)
    .map((route) => route.id);

  assert.equal(modelsEndpoint("https://gw.test/v1"), "https://gw.test/v1/models");
  assert.equal(modelsEndpoint("https://gw.test/v1/"), "https://gw.test/v1/models");

  // A profile is addressed by settingsPath inside its namespace's value.
  const descriptors = [
    {
      ns: "llm-pi-ai",
      value: {
        providers: { "my-gateway": { baseURL: "https://gw.test/v1", apiKeyEnv: "MY_GW_KEY" } },
      },
    },
  ];
  const entry = {
    provider: "my-gateway",
    displayName: "My Gateway",
    settingsNs: "llm-pi-ai",
    settingsPath: ["providers", "my-gateway"],
  };
  assert.deepEqual(readConfiguredProfile(entry, descriptors), {
    baseURL: "https://gw.test/v1",
    apiKeyEnv: "MY_GW_KEY",
  });
  assert.equal(readConfiguredProfile({ ...entry, settingsNs: "absent" }, descriptors), undefined);
  assert.equal(
    readConfiguredProfile({ ...entry, settingsPath: ["providers", "other"] }, descriptors),
    undefined,
  );

  // Each status the endpoint can answer with maps to the light it deserves.
  const statuses = [
    [200, "available"],
    [401, "error"],
    [403, "error"],
    [429, "error"],
    [404, "unknown"],
    [500, "unknown"],
  ];
  for (const [status, expected] of statuses) {
    const snap = await probeConfiguredRoute(
      entry,
      { baseURL: "https://gw.test/v1", apiKeyEnv: "MY_GW_KEY" },
      "secret",
      async () => new Response("", { status }),
    );
    assert.equal(snap.status, expected, `HTTP ${status} must read as ${expected}`);
  }

  // The credential is sent, and a missing one is reported rather than probed.
  let sentAuth;
  await probeConfiguredRoute(
    entry,
    { baseURL: "https://gw.test/v1", apiKeyEnv: "MY_GW_KEY" },
    "secret",
    async (url, init) => {
      sentAuth = init.headers["authorization"];
      return new Response("", { status: 200 });
    },
  );
  assert.equal(sentAuth, "Bearer secret");
  const noCred = await probeConfiguredRoute(
    entry,
    { baseURL: "https://gw.test/v1", apiKeyEnv: "MY_GW_KEY" },
    undefined,
    async () => {
      throw new Error("must not be called");
    },
  );
  assert.equal(noCred.status, "unknown");
  assert.match(noCred.message, /No credential configured \(MY_GW_KEY\)/);

  // A keyless local endpoint is probed unauthenticated.
  let keylessAuth = "unset";
  const keyless = await probeConfiguredRoute(
    entry,
    { baseURL: "http://127.0.0.1:11434/v1" },
    undefined,
    async (url, init) => {
      keylessAuth = init.headers["authorization"];
      return new Response("", { status: 200 });
    },
  );
  assert.equal(keylessAuth, undefined);
  assert.equal(keyless.status, "available");

  // A route with no endpoint says so instead of implying health.
  const noEndpoint = await probeConfiguredRoute(entry, {}, undefined, async () => {
    throw new Error("must not be called");
  });
  assert.equal(noEndpoint.status, "unknown");

  // Built-ins keep their own probes; only uncovered routes get one from here.
  const built = createConfiguredProviders({
    listConfigurable: () => [entry, { ...entry, provider: "kimi-sub" }],
    describeSettings: () => descriptors,
    readToken: async () => "secret",
    covered: (provider) => PROBE_ROUTE_IDS.includes(provider),
    fetch: async () => new Response("", { status: 200 }),
  });
  assert.deepEqual(
    built.map((p) => p.id),
    ["my-gateway"],
  );

  // A declared-but-unconfigured route gets no probe at all, so the panel is not
  // filled with rows whose only message is that nobody configured them.
  const unconfigured = createConfiguredProviders({
    listConfigurable: () => [
      entry,
      { ...entry, provider: "catalog-route", settingsPath: ["providers", "catalog-route"] },
    ],
    describeSettings: () => descriptors,
    readToken: async () => "secret",
    covered: () => false,
    fetch: async () => new Response("", { status: 200 }),
  });
  assert.deepEqual(
    unconfigured.map((p) => p.id),
    ["my-gateway"],
  );

  // Routes this plugin owns never fall through to the generic prober.
  for (const owned of EXTENSION_IDS) {
    assert.deepEqual(
      createConfiguredProviders({
        listConfigurable: () => [{ ...entry, provider: owned }],
        describeSettings: () => descriptors,
        readToken: async () => "secret",
        covered: (candidate) => EXTENSION_IDS.includes(candidate),
        fetch: async () => new Response("", { status: 200 }),
      }).map((p) => p.id),
      [],
      `${owned} is owned and must keep its own probe`,
    );
  }
  assert.equal((await built[0].read({ aborted: false })).status, "available");
  assert.equal((await built[0].read({ aborted: true })).status, "unknown");

  console.log("configured-route status lights ok");
}

console.log("plugin check passed");

// jscpd:ignore-end
