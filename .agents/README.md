# agents

Personal agent stack on top of DeepSeek Harness (`dsh`). Everything is a harness plugin.

## Layout

- `AGENTS.md` — repo conventions for agents (commit cadence, doc-sync rule, plugin scaffold).
- `PLAN.md` — authoritative plan: repos, Andromeda mapping, phases, dependency policy.
- `PRD.md` — product requirements: settings IA, Keychain, session modes, agents + live personas, themes, quotas, sidebar batch; and the `dsh-tweaks` harness extension layer (Option A).
- `BLOCKED.md` — harness-seam ledger: every feature that needs to reach the harness, its anchors, and the decision (`replaced`/`deferred`/`unblocks`). Harness stays pristine.
- `CONTEXT.md` — chronological session memory (append-only).
- `BACKLOG.md` — opencode-parity delta re-keyed by owning plugin.
- `harness/` — pinned checkout of `deepseek-ai/deepseek-harness` (source of truth, kept pristine).
- `plugins/` — one repo per plugin, each a git submodule:
  - `dsh-dialects/` — provider wire-protocol abstraction (bundled: openai, claude, gemini).
  - `dsh-providers/` — LLM provider adapters: 6 subscription routes + 8 API-key routes (openai/anthropic/gemini/grok/deepseek/mistral/groq/openrouter).
  - `dsh-credentials/` — account/credential manager (v1: LLM-enabling; v2: full manager).
  - `dsh-tweaks/` — general features: providers filter, state-folder (`homeRoot`) + command config; v2: share links, stats/sessions CLI verbs, plan toggle, fork undo/redo, slash commands, keybinds; **v3 (P11): the harness extension layer (Option A)** — owns the replaced sidebar/workspaces/settings occupants and the plugin-facing seams (`sidebar.newSession`, `sidebar.history`, `settings.section.icon`, `settings.models.row`).
  - `dsh-subscriptions/` — profile bundle mounting providers + credentials + defaults.
  - `dsh-tui/` — client-only TUI (cannibalized opencode client; scaffolded, impl later).
  - `dsh-desktop/` — Tauri v2 thin shell + lifecycle plugin: readiness route (`/__dsh-desktop/health`), boot URL, spawn helpers.
  - `dsh-themes/` — VS Code/TextMate themes: store + Open VSX catalog, `/themes.json` route, browser bundle, `dsh theme` CLI (shipped, boot-verified).
  - `dsh-formatters/` — per-extension formatter commands: `format` tool + auto-format-on-edit + `dsh formatter` CLI (shipped, boot-verified).
  - `dsh-lsp/` — LSP server table for the harness LSP seam: `mergeServers`, `Lsp` def + `lsp-stdio`/`tool-lsp` mounts, `dsh lsp` CLI (shipped, boot-verified).
  - `dsh-tools/` — config-file custom tools: `dsh-tools.tools` map → `ctx.tools` entries, `{name}` placeholders, `dsh tool` CLI (shipped, boot-verified).
  - `dsh-agents/` — custom agents as JSON/MD persona files materialized into agent presets: base composition spliced, live roster, `dsh agents` CLI (shipped, boot-verified).
   - `dsh-repos/` — repo workflows: branch/commit/push/PR consuming `GITHUB_OAUTH_TOKEN`, `dsh repos` CLI (shipped, boot-verified).
  - `dsh-session-modes/` — explicit tool/search/action/plan/agent/shell/code modes with durable state, executor policy, and request routing (in progress).
  - `dsh-quotas/` — provider quota/usage snapshots and a settings dashboard below Models (in progress; scaffolded + live snapshots route).
- `scripts/dsh` — launcher: checks current state home, adjusts to configured root, execs the harness binary. Routes plugin verbs: `accounts` (dsh-credentials), `stats`/`sessions`/`share` (dsh-tweaks), `theme` (dsh-themes), `lsp` (dsh-lsp), `formatter` (dsh-formatters), `agents` (dsh-agents).

## State

- `DSH_HOME` = `~/.agents` by default (configurable via `dsh-tweaks` `homeRoot`).
- The state folder is never committed.
