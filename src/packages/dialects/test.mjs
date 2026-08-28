import assert from "node:assert/strict";
import { openaiDialect } from "./lib/openai.js";
import { claudeDialect } from "./lib/claude.js";
import { geminiDialect } from "./lib/gemini.js";
import {
  antigravityDialect,
  splitConversation,
  ANTIGRAVITY_PROJECT_HEADER,
} from "./lib/antigravity.js";
import { translateOpenAi } from "./lib/translate-openai.js";
import { translateClaude } from "./lib/translate-claude.js";
import { translateGemini } from "./lib/translate-gemini.js";

const /** id implementation. */ id = () => crypto.randomUUID();

/** userMessage implementation. */
function userMessage(text) {
  return { id: id(), role: "user", content: [{ type: "text", text }], source: { kind: "user" } };
}
/** assistantText implementation. */
function assistantText(text) {
  return {
    id: id(),
    role: "assistant",
    content: [{ type: "text", text }],
    source: { kind: "model", provider: "p", model: "m" },
  };
}

/**
 * Collects elements from an asynchronous generator `gen` into an array `out`.
 * Guarantees that the returned array contains all elements yielded by `gen`.
 * On failure, throws an error, preventing the caller from proceeding with an invalid result.
 */
async function collect(gen) {
  const out = [];
  for await (const c of gen) out.push(c);
  return out;
}

/**
 * Logs "ok -" followed by the provided name to the console.
 * Guarantees that the message is logged for the given name.
 * On failure, throws an error, preventing the caller from proceeding with an invalid result.
 */
const ok = (name) => {
    console.log("ok -", name);
  };

// ---- openai: serialize shape ----
const req = openaiDialect.serialize(
  {
    provider: "p",
    model: "deepseek",
    system: "be brief",
    messages: [userMessage("hi")],
    tools: [{ name: "t", description: "a", parameters: { type: "object" } }],
    temperature: 0.3,
    maxTokens: 64,
    stop: ["END"],
  },
  { apiKey: "k" },
  "https://api.kimi.com/coding/v1",
  { maxTokens: 128 },
);
assert.equal(req.url, "https://api.kimi.com/coding/v1/chat/completions");
assert.equal(req.framing, "sse");
assert.equal(req.headers.authorization, "Bearer k");
const body = JSON.parse(req.body);
assert.equal(body.system, undefined);
assert.equal(body.messages[0].role, "system");
assert.equal(body.messages[0].content, "be brief");
assert.equal(body.messages[1].content, "hi");
assert.equal(body.tools[0].function.name, "t");
assert.equal(body.stream, true);
assert.equal(body.max_tokens, 64);
assert.deepEqual(body.stop, ["END"]);
let authErr;
try {
  openaiDialect.serialize({ provider: "p", model: "m", messages: [] }, {}, "https://x", {
    maxTokens: 1,
  });
} catch (e) {
  authErr = e;
}
assert.equal(authErr.code, "AUTH");
ok("openai serialize");

// ---- openai: translate with reasoning + tool calls + disjoint usage ----
const sse = [
  { choices: [{ delta: { reasoning_content: "think" } }] },
  { choices: [{ delta: { content: "Hello" } }] },
  {
    choices: [
      {
        delta: {
          tool_calls: [{ index: 0, id: "call_1", function: { name: "search", arguments: "" } }],
        },
      },
    ],
  },
  { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"q":' } }] } }] },
  { choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '"x"}' } }] } }] },
  { choices: [{ delta: {}, finish_reason: "tool_calls" }] },
  {
    usage: { prompt_tokens: 12, completion_tokens: 3, prompt_tokens_details: { cached_tokens: 5 } },
  },
];
const payloads = [...sse.map((c) => JSON.stringify(c)), "[DONE]"];
const chunks = await collect(translateOpenAi(payloads));
const types = chunks.map((c) => c.type);
assert.deepEqual(types, [
  "block-start",
  "reasoning-delta",
  "block-start",
  "text-delta",
  "block-start",
  "tool-call-delta",
  "tool-call-delta",
  "tool-call-delta",
  "block-end",
  "block-end",
  "block-end",
  "usage",
  "finish",
]);
const usage = chunks.find((c) => c.type === "usage").usage;
assert.equal(usage.inputTokens, 7);
assert.equal(usage.cacheReadTokens, 5);
assert.equal(usage.outputTokens, 3);
const finish = chunks.at(-1);
assert.equal(finish.reason.kind, "tool-calls");
const toolBlock = chunks.find((c) => c.type === "block-end" && c.block.type === "tool-call").block;
assert.equal(toolBlock.name, "search");
assert.equal(toolBlock.arguments, '{"q":"x"}');
ok("openai translate contract");

// ---- openai: EMPTY_RESPONSE ----
const empty = await collect(translateOpenAi(["[DONE]"]));
assert.equal(empty.at(-1).reason.kind, "error");
assert.equal(empty.at(-1).reason.failure.code, "EMPTY_RESPONSE");
ok("openai empty response");

// ---- claude: serialize ----
const creq = claudeDialect.serialize(
  { provider: "p", model: "sonnet", messages: [userMessage("hi")] },
  { token: "t" },
  "https://api.anthropic.com/v1",
  { maxTokens: 100 },
);
assert.equal(creq.url, "https://api.anthropic.com/v1/messages");
assert.equal(creq.headers["anthropic-version"], "2023-06-01");
assert.equal(creq.headers.authorization, "Bearer t");
const cbody = JSON.parse(creq.body);
assert.equal(cbody.max_tokens, 100);
assert.equal(cbody.stream, true);
assert.equal(cbody.messages[0].role, "user");
assert.equal(cbody.messages[0].content[0].text, "hi");
assert.equal(creq.framing, "sse");
// Anthropic's OAuth subscription endpoint checks that the request identifies
// as Claude Code. Without the leading system block it refuses Opus and Sonnet
// with a rate_limit_error whose message is literally "Error", while the
// account's 5h utilization sits at 0.43. API-key requests must not carry it.
{
  const base = {
    model: "claude-opus-5",
    messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
  };
  const defaults = { maxTokens: 1024 };

  const oauth = claudeDialect.serialize(
    base,
    { token: "oauth-token" },
    "https://api.anthropic.com/v1",
    defaults,
  );
  const oauthBody = JSON.parse(oauth.body);
  assert.deepEqual(oauthBody.system, [
    {
      type: "text",
      text: "You are Claude Code, Anthropic's official CLI for Claude.",
      cache_control: { type: "ephemeral" },
    },
  ]);

  // The caller's own prompt is kept, after the identity, never dropped.
  const withSystem = claudeDialect.serialize(
    { ...base, system: "Be terse." },
    { token: "oauth-token" },
    "https://api.anthropic.com/v1",
    defaults,
  );
  assert.deepEqual(JSON.parse(withSystem.body).system, [
    {
      type: "text",
      text: "You are Claude Code, Anthropic's official CLI for Claude.",
      cache_control: { type: "ephemeral" },
    },
    { type: "text", text: "Be terse.", cache_control: { type: "ephemeral" } },
  ]);

  // An API key gets no injected identity.
  assert.equal(
    JSON.parse(
      claudeDialect.serialize(base, { apiKey: "sk-test" }, "https://api.anthropic.com/v1", defaults)
        .body,
    ).system,
    undefined,
  );
  assert.equal(
    JSON.parse(
      claudeDialect.serialize(
        { ...base, system: "Be terse." },
        { apiKey: "sk-test" },
        "https://api.anthropic.com/v1",
        defaults,
      ).body,
    ).system,
    "Be terse.",
  );
  ok("claude oauth identity system block");
}

// --- antigravity: the subscription transport, not the Code Assist one ---
{
  const auth = { token: "tok", headers: { [ANTIGRAVITY_PROJECT_HEADER]: "iron-courage-jc5ww" } };
  const opts = {
    model: "default",
    system: "Be terse.",
    messages: [
      { role: "user", content: [{ type: "text", text: "first" }] },
      { role: "assistant", content: [{ type: "text", text: "answer" }] },
      { role: "user", content: [{ type: "text", text: "second" }] },
    ],
  };
  const req = antigravityDialect.serialize(
    opts,
    auth,
    "https://cloudcode-pa.googleapis.com/v1internal",
    { maxTokens: 64 },
  );
  // The method is what separates the subscription pool from the free tier.
  assert.equal(req.url, "https://cloudcode-pa.googleapis.com/v1internal:streamGenerateChat");
  const body = JSON.parse(req.body);
  // A bare project id: the "projects/<id>" form is refused as an IAM path.
  assert.equal(body.project, "iron-courage-jc5ww");
  assert.equal(body.userMessage, "second");
  assert.deepEqual(body.history, [
    { content: "Be terse." },
    { content: "first" },
    { content: "answer" },
  ]);
  // The project is credential material, not something to leak onto the wire.
  assert.equal(req.headers[ANTIGRAVITY_PROJECT_HEADER], undefined);
  assert.equal(req.headers["user-agent"], "Antigravity/2.0.1 (Jetbrains; DARWIN_ARM64)");
  // modelConfigId stays absent: every published id is refused, and omitting it
  // serves the account default on the paid tier.
  assert.equal(body.modelConfigId, undefined);

  assert.throws(
    () =>
      antigravityDialect.serialize(opts, { token: "tok" }, "https://x/v1internal", {
        maxTokens: 64,
      }),
    /ANTIGRAVITY_PROJECT/,
  );
  assert.throws(
    () =>
      antigravityDialect.serialize(opts, { headers: auth.headers }, "https://x/v1internal", {
        maxTokens: 64,
      }),
    /no bearer token/,
  );
  assert.throws(
    () =>
      splitConversation({
        model: "m",
        messages: [{ role: "assistant", content: [{ type: "text", text: "a" }] }],
      }),
    /trailing user message/,
  );

  const wire = JSON.stringify([
    { markdown: "wor" },
    { markdown: "king", usageMetadata: { candidatesTokenCount: "2", totalTokenCount: "10" } },
  ]);
  const stream = new ReadableStream({
    /**
     * Starts the stream by enqueuing an empty JSON array and closing the stream.
     *
     * Emits an error if the stream is started without any content, indicating an unexpected finish.
     *
     * @param {WritableStreamDefaultWriter<Uint8Array>} c - The writer to which the stream writes.
     */
    start(c) {
      c.enqueue(new TextEncoder().encode(wire));
      c.close();
    },
  });
  const chunks = [];
  for await (const chunk of antigravityDialect.parse(stream)) chunks.push(chunk);
  assert.equal(
    chunks
      .filter((c) => c.type === "text-delta")
      .map((c) => c.text)
      .join(""),
    "working",
  );
  const usage = chunks.find((c) => c.type === "usage");
  assert.deepEqual(usage.usage, { inputTokens: 8, outputTokens: 2 });
  assert.equal(chunks.at(-1).reason.kind, "stop");

  // An empty answer is an error finish, not a silent success.
  const empty = new ReadableStream({
    /** start implementation. */
    start(c) {
      c.enqueue(new TextEncoder().encode("[]"));
      c.close();
    },
  });
  const emptyChunks = [];
  for await (const chunk of antigravityDialect.parse(empty)) emptyChunks.push(chunk);
  assert.equal(emptyChunks.at(-1).reason.kind, "error");
  ok("antigravity dialect");
}

ok("claude serialize");

// ---- claude: translate tool_use + usage + finish, message_id replay ----
const events = [
  {
    event: "message_start",
    data: JSON.stringify({
      type: "message_start",
      message: { id: "msg_1", usage: { input_tokens: 8 } },
    }),
  },
  {
    event: "content_block_start",
    data: JSON.stringify({
      type: "content_block_start",
      index: 0,
      content_block: { type: "tool_use", id: "tu_1", name: "search", input: {} },
    }),
  },
  {
    event: "content_block_delta",
    data: JSON.stringify({
      type: "content_block_delta",
      index: 0,
      delta: { type: "input_json_delta", partial_json: '{"q":' },
    }),
  },
  {
    event: "content_block_delta",
    data: JSON.stringify({
      type: "content_block_delta",
      index: 0,
      delta: { type: "input_json_delta", partial_json: '"x"}' },
    }),
  },
  { event: "content_block_stop", data: JSON.stringify({ type: "content_block_stop", index: 0 }) },
  {
    event: "message_delta",
    data: JSON.stringify({
      type: "message_delta",
      delta: { stop_reason: "tool_use" },
      usage: { output_tokens: 3 },
    }),
  },
  { event: "message_stop", data: JSON.stringify({ type: "message_stop" }) },
];
const cchunks = await collect(translateClaude(events));
const ctypes = cchunks.map((c) => c.type);
assert.deepEqual(ctypes, [
  "block-start",
  "tool-call-delta",
  "tool-call-delta",
  "tool-call-delta",
  "block-end",
  "usage",
  "finish",
]);
const cusage = cchunks.find((c) => c.type === "usage").usage;
assert.equal(cusage.inputTokens, 8);
assert.equal(cusage.outputTokens, 3);
const cfin = cchunks.at(-1);
assert.equal(cfin.reason.kind, "tool-calls");
assert.deepEqual(cfin.replayState, { response: { messageId: "msg_1" } });
const ctool = cchunks.find((c) => c.type === "block-end").block;
assert.equal(ctool.name, "search");
assert.equal(ctool.arguments, '{"q":"x"}');
ok("claude translate contract");

// ---- gemini: serialize ----
const greq = geminiDialect.serialize(
  { provider: "p", model: "gemini-2.5", messages: [userMessage("hi")] },
  { cookies: { "__Secure-1PSID": "a", SNlM0e: "b" } },
  "https://x/gemini-dispatch/streamGenerateContent?alt=sse",
  { maxTokens: 64 },
);
assert.equal(greq.framing, "ndjson");
assert.equal(greq.url, "https://x/gemini-dispatch/streamGenerateContent?alt=sse");
assert.equal(greq.headers.cookie, "__Secure-1PSID=a; SNlM0e=b");
const gbody = JSON.parse(greq.body);
assert.equal(gbody.contents[0].role, "user");
assert.equal(gbody.contents[0].parts[0].text, "hi");
assert.equal(gbody.generationConfig.maxOutputTokens, 64);
ok("gemini serialize");

// ---- gemini: translate cumulative text + functionCall ----
const glines = [
  { candidates: [{ content: { parts: [{ text: "Hello" }] } }] },
  { candidates: [{ content: { parts: [{ text: "Hello world" }] } }] },
  {
    candidates: [
      {
        content: {
          parts: [{ text: "Hello world" }, { functionCall: { name: "search", args: { q: "x" } } }],
        },
      },
    ],
  },
  {
    candidates: [
      {
        content: {
          parts: [{ text: "Hello world" }, { functionCall: { name: "search", args: { q: "x" } } }],
        },
        finishReason: "STOP",
      },
    ],
    usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 2 },
  },
];
const gchunks = await collect(translateGemini(glines.map((l) => JSON.stringify(l))));
const gtypes = gchunks.map((c) => c.type);
assert.deepEqual(gtypes, [
  "block-start",
  "text-delta",
  "text-delta",
  "block-start",
  "tool-call-delta",
  "block-end",
  "block-end",
  "usage",
  "finish",
]);
const gusage = gchunks.find((c) => c.type === "usage").usage;
assert.equal(gusage.inputTokens, 4);
assert.equal(gusage.outputTokens, 2);
const gfin = gchunks.at(-1);
assert.equal(gfin.reason.kind, "stop");
const gtools = gchunks.filter((c) => c.type === "block-end").map((c) => c.block);
assert.equal(gtools[0].type, "text");
assert.equal(gtools[0].text, "Hello world");
assert.equal(gtools[1].type, "tool-call");
assert.equal(gtools[1].name, "search");
assert.equal(gtools[1].arguments, '{"q":"x"}');
ok("gemini translate contract");

// ---- gemini: no content -> EMPTY_RESPONSE ----
const gem = await collect(translateGemini(['{"candidates":[{"content":{"parts":[]}}]}']));
assert.equal(gem.at(-1).reason.kind, "error");
assert.equal(gem.at(-1).reason.failure.code, "EMPTY_RESPONSE");
ok("gemini empty response");

// ---- claude tool-result name mapping in gemini serialize ----
const toolCallMsg = {
  id: id(),
  role: "assistant",
  content: [{ type: "tool-call", id: "call_9", name: "search", arguments: '{"q":"x"}' }],
  source: { kind: "model", provider: "p", model: "m" },
};
const toolResultMsg = {
  id: id(),
  role: "user",
  content: [{ type: "tool-result", toolCallId: "call_9", content: [{ type: "text", text: "r1" }] }],
  source: { kind: "tool", callId: "call_9" },
};
const grt = geminiDialect.serialize(
  { provider: "p", model: "g", messages: [userMessage("q"), toolCallMsg, toolResultMsg] },
  { cookies: { x: "y" } },
  "https://x:streamGenerateContent",
  { maxTokens: 10 },
);
assert.equal(grt.url, "https://x:streamGenerateContent?alt=sse");
const rbody = JSON.parse(grt.body);
assert.equal(rbody.contents[1].role, "model");
assert.equal(rbody.contents[1].parts[0].functionCall.name, "search");
assert.equal(rbody.contents[2].role, "user");
assert.equal(rbody.contents[2].parts[0].functionResponse.name, "search");
assert.deepEqual(rbody.contents[2].parts[0].functionResponse.response, { result: "r1" });
ok("gemini tool round-trip serialize");

console.log("\nall dialect protocol tests passed");
