# agents

Personal agent stack on top of DeepSeek Harness (`dsh`). Everything is a harness plugin.

## Layout

- `.agents/` — project docs + workflow hooks (this directory):
  - `AGENTS.md` — repo conventions for agents (commit cadence, doc-sync rule, plugin scaffold).
  - `PLAN.md` — authoritative plan: repos, Andromeda mapping, phases, dependency policy.
  - `PRD.md` — product requirements: settings IA, Keychain, session modes, agents + live personas, themes, quotas, sidebar batch; and the `dsh-tweaks` harness extension layer (Option A).
  - `BLOCKED.md` — harness-seam ledger: every feature that needs to reach the harness, its anchors, and the decision (`replaced`/`deferred`/`unblocks`). Harness stays pristine.
  - `CONTEXT.md` — chronological session memory (append-only).
  - `BACKLOG.md` — opencode-parity delta re-keyed by owning plugin.
  - `hooks/` — pre-commit, commit-msg, pre-push workflow enforcement.
- `harness/` — pinned checkout of `deepseek-ai/deepseek-harness` (source of truth, kept pristine).
- `plugins/` — one repo per plugin, each a git submodule:
  - `dsh-dialects/` — provider wire-protocol abstraction (bundled: openai, claude, gemini, code-assist).
  - `dsh-providers/` — LLM provider adapters: 5 subscription routes + 8 API-key routes (openai/anthropic/gemini/grok/deepseek/mistral/groq/openrouter).
  - `dsh-credentials/` — account/credential manager (v2: full vault parity port).
  - `dsh-tweaks/` — general features: providers filter, state-folder (`homeRoot`) + command config; v2: share links, stats/sessions CLI verbs, plan toggle, fork undo/redo, slash commands, keybinds; v3 (P11): the harness extension layer — owns replaced sidebar/workspaces/settings occupants and plugin-facing seams.
  - `dsh-subscriptions/` — **archived**: merged into dsh-providers (P12.1).
  - `dsh-loops/` — goal-based loops from `.agents/loops`: criteria + workflows, deterministic orchestration, agent tools + settings (P12.8).
  - `dsh-tui/` — standalone TUI client for dsh (talks to dsh as backend; separate repo, NOT modifying privatecode).
  - `dsh-desktop/` — Tauri v2 thin shell + lifecycle plugin: readiness route, boot URL, spawn helpers.
  - `dsh-themes/` — VS Code/TextMate themes: store + Open VSX catalog, `/themes.json` route, browser bundle, `dsh theme` CLI.
  - `dsh-formatters/` — per-extension formatter commands: `format` tool + auto-format-on-edit + `dsh formatter` CLI.
  - `dsh-lsp/` — LSP server table for the harness LSP seam: `mergeServers`, `Lsp` def + `lsp-stdio`/`tool-lsp` mounts, `dsh lsp` CLI.
  - `dsh-tools/` — config-file custom tools: `dsh-tools.tools` map → `ctx.tools` entries, `{name}` placeholders, `dsh tool` CLI.
  - `dsh-agents/` — custom agents as JSON/MD persona files materialized as agent presets: base composition spliced, live roster, `/persona` command, `dsh agents` CLI.
  - `dsh-repos/` — repo workflows: branch/commit/push/PR consuming `GITHUB_OAUTH_TOKEN`, `dsh repos` CLI.
  - `dsh-actions/` — renamed from dsh-session-modes (P12.4): explicit actions with durable state, executor policy, request routing, file-based actions under `.agents/actions`.
  - `dsh-quotas/` — **archived**: merged into dsh-providers (P12.1).
  - `privatecode/` — opencode fork (subscription providers, OAuth refresh, TUI rendering); kept as-is (works), not modified.
- `scripts/dsh` — launcher: checks current state home, adjusts to configured root, execs the harness binary. Routes plugin verbs: `accounts` (dsh-credentials), `stats`/`sessions`/`share` (dsh-tweaks), `theme` (dsh-themes), `lsp` (dsh-lsp), `formatter` (dsh-formatters), `agents` (dsh-agents).

## State

- `DSH_HOME` = `~/.agents` by default (configurable via `dsh-tweaks` `homeRoot`).
- The state folder is never committed.
