---
date: 2026-10-11
status: active
---

# Native profiles

A profile is a real DSH directory containing `package.json` with `dsh.profile.bundles` and an optional `cordis.patch.yml` user layer. The Stack repository stores shareable templates at `profiles/<name>/`, but the installed DSH instance owns the user's active profiles.

Install all experiences through DSH's native `dsh plugin --profile <name> add @dsh-stack/stack`. Every profile consumes exactly the same Stack composition; only the DSH-provided surface and independent presentation adapters vary. A normal DSH profile initially contains its base/surface bundle; Stack composes additively above them. The user may toggle optional components via DSH; Stack never modifies profile package manifests, installs symlinks, or starts/stops DSH.

Arbitrarily nested native bundles are under `plugins/`; profile templates remain at root `profiles/`. A nested bundle declares child bundles in its package manifest and receives a flattened patch at build time, since DSH does not automatically apply transitive bundle patches.

A separate `stack-headless`/`stack-tui` aggregate is forbidden: profile surface differences may not fork the nested Stack bundle DAG. DarkFactory and Cognition are independent external source submodules at `plugins/DarkFactory` and `plugins/Cognition`. Their placement does not mount them into the Stack runtime; integration requires a verified native DSH plugin and explicit composition.

## Terminal UI profile

`profiles/tui/` selects `@deepseek-ai/dsh-base`, the canonical `@dsh-stack/stack`, and Chimney's independently released `@deepseek-harness-tui/dsh-tui` in that order. Source is a Git submodule at `plugins/dsh-tui` with its own pnpm workspace and nested submodule; no source rewrite or Stack-bundled copy. Compatible DSH versions must satisfy both native peer contracts without allowances.
