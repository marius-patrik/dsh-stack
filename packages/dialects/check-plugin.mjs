import * as plugin from "./lib/index.js";
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape } from "../../scripts/plugin-check-kit.mjs";

assertLoaderShape(plugin, "dialects");
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

const ctx = new Context();
plugin.apply(ctx, {});
if (!ctx.dialects) throw new Error("ctx.dialects not provided");
const ids = ctx.dialects.list().map((d) => d.id);
console.log("registry dialects:", ids);
assert.deepEqual(
  ids,
  ["openai", "claude", "gemini", "code-assist", "antigravity"],
  "unexpected dialect registry",
);
const request = ctx.dialects
  .get("claude")
  .serialize(
    { provider: "p", model: "m", messages: [] },
    { apiKey: "k" },
    "https://api.anthropic.com/v1",
    { maxTokens: 10 },
  );
console.log("claude serialize url:", request.url, "| framing:", request.framing);

// The code-assist dialect nests the vertex request under `request` and takes
// an OAuth bearer token against the v1internal service root.
const assist = ctx.dialects.get("code-assist");
assert.throws(
  () =>
    assist.serialize(
      { provider: "p", model: "m", messages: [] },
      {},
      "https://cloudcode-pa.googleapis.com/v1internal",
      { maxTokens: 10 },
    ),
  /bearer token/,
);
const assistRequest = assist.serialize(
  {
    provider: "p",
    model: "gemini-3.6-flash",
    system: "be terse",
    messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
  },
  { token: "t" },
  "https://cloudcode-pa.googleapis.com/v1internal",
  { maxTokens: 10 },
);
assert.equal(
  assistRequest.url,
  "https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse",
);
assert.equal(assistRequest.framing, "sse");
assert.equal(assistRequest.headers.authorization, "Bearer t");
const wrapped = JSON.parse(assistRequest.body);
assert.equal(wrapped.model, "gemini-3.6-flash");
assert.equal(wrapped.project, "");
assert.ok(typeof wrapped.user_prompt_id === "string" && wrapped.user_prompt_id.length === 36);
assert.deepEqual(wrapped.request.contents, [{ role: "user", parts: [{ text: "hi" }] }]);
assert.equal(wrapped.request.systemInstruction.parts[0].text, "be terse");
assert.ok(
  typeof wrapped.request.session_id === "string" && wrapped.request.session_id.length === 36,
);
console.log("code-assist serialize ok:", assistRequest.url);
console.log("plugin check passed");
