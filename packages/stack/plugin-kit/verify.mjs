import assert from "node:assert/strict";
import {
  authoringScalar,
  sanitizeAuthoringId,
  settingsNamespace,
  splitAuthoringMarkdown,
} from "./lib/index.js";

assert.equal(sanitizeAuthoringId("Some NAME", "fallback"), "some-name");
assert.equal(sanitizeAuthoringId("...", "fallback"), "fallback");
assert.equal(authoringScalar(' "quoted value" '), "quoted value");

const markdown = splitAuthoringMarkdown("---\nid: example\n---\nBody");
assert.equal(markdown.fields.id, "example");
assert.equal(markdown.body, "Body");
assert.equal(settingsNamespace("my-plugin"), "my-plugin");

console.log("Plugin kit verification passed.");
