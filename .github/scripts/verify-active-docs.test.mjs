import assert from "node:assert/strict";
import test from "node:test";
import { findInvalidReferences } from "./verify-active-docs.mjs";

test("accepts native composition and package ownership paths", () => {
  assert.deepEqual(
    findInvalidReferences(
      "Native plugins live in packages/stack/. Native DSH owns profiles and activation.",
    ),
    [],
  );
});

test("rejects retired implementation locations", () => {
  assert.deepEqual(findInvalidReferences("Use src/packages/agent-foo and publish/packs/bundle."), [
    "retired source path",
  ]);
});

test("rejects inactive rule and request references", () => {
  assert.deepEqual(
    findInvalidReferences("See plugin-extension-and-pack-model.md and .agents/requests/"),
    ["inactive document link"],
  );
});

test("rejects inconsistent product naming", () => {
  assert.deepEqual(findInvalidReferences("KiKi"), ["retired product name"]);
});
