# @dsh-stack/dialect-gemini

The Google Gemini wire dialect extension. Registers `geminiDialect` into the `@dsh-stack/dialects` registry (`stack.ai.dialects`) so Gemini-family provider routes can resolve it by id at runtime via `ctx.dialects.get("gemini")`. Also exports the shared Gemini serialization helpers (`serializeContents`, `buildToolNameIndex`, `translateGemini`) that `@dsh-stack/dialect-code-assist` wraps — the Code Assist wire is a JSON envelope over the same `GenerateContent` vocabulary.

## Model Experience

No model-facing surface. This is wire-serialization plumbing consumed by provider extensions, not something a model or user interacts with directly.
