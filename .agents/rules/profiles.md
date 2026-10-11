---
date: 2026-10-11
status: active
---

# Native profiles

A profile is a real DSH directory containing `package.json` with `dsh.profile.bundles` and an optional `cordis.patch.yml` user layer. The Stack repository stores shareable templates at `profiles/<name>/`, but the installed DSH instance owns the user's active profiles.

Install complete experiences through DSH's native `dsh plugin --profile web add @dsh-stack/stack` or `dsh plugin --profile headless add @dsh-stack/stack-headless`. A normal DSH profile initially contains its DSH base and surface bundles; the Stack bundle composes additively above them. The user may toggle optional components via DSH; Stack never modifies profile package manifests, installs symlinks, or starts/stops DSH.

Arbitrarily nested reusable bundles are under `bundles/`, not under `profiles/`. A nested bundle declares child bundles in its package manifest and receives a flattened patch at build time, since DSH does not automatically apply transitive bundle patches.

DarkFactory and SkyAgent remain under `_migrate/` until their native implementations are verified.

## Terminal UI profile

`profiles/tui/` selects `@deepseek-ai/dsh-base`, `@dsh-stack/stack-headless`, and Chimney's independently released `@deepseek-harness-tui/dsh-tui` in that order. Source is a Git submodule at `plugins/dsh-tui` with its own pnpm workspace and nested submodule; no source rewrite or Stack-bundled copy. Compatible DSH versions must satisfy both native peer contracts without allowances.
