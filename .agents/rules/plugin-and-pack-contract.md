---
date: 2026-08-27
status: active
---

# Plugin and pack contract

Every canonical package follows the common package contract: unique `@dsh-stack/<id>` name, independent semantic version, ESM, explicit exports, publishable files only, appropriate `stack.kind`, globally unique namespaced `stack.id`, explicit required/optional dependencies, and build/typecheck/test/verify scripts. No checked-in generated implementation output is permitted.

A pack is a composition/distribution unit over canonical packages/plugins. Packs do not create duplicate runtime implementations.
