# agents

Personal agent stack on top of DeepSeek Harness (`dsh`). Everything is a harness plugin.

## Layout

- `AGENTS.md` — repo conventions for agents (commit cadence, doc-sync rule, plugin scaffold).
- `PLAN.md` — authoritative plan: repos, Andromeda mapping, phases, dependency policy.
- `CONTEXT.md` — chronological session memory (append-only).
- `BACKLOG.md` — opencode-parity delta re-keyed by owning plugin.
- `harness/` — pinned checkout of `deepseek-ai/deepseek-harness` (source of truth, kept pristine).
- `plugins/` — one repo per plugin, each a git submodule:
  - `dsh-dialects/` — provider wire-protocol abstraction (bundled: openai, claude, gemini).
  - `dsh-providers/` — LLM provider adapters (kimi-code, kimi-sub, claude-sub, cursor-sub, grok-sub, gemini-sub).
  - `dsh-credentials/` — account/credential manager (v1: LLM-enabling; v2: full manager).
  - `dsh-tweaks/` — general features: providers filter, state-folder (`homeRoot`) + command config; v2: share links, stats/sessions CLI verbs, plan toggle, fork undo/redo, slash commands, keybinds.
  - `dsh-subscriptions/` — profile bundle mounting providers + credentials + defaults.
  - `dsh-tui/` — client-only TUI (cannibalized opencode client; scaffolded, impl later).
  - `dsh-desktop/` — Tauri v2 thin shell + lifecycle plugin: readiness route (`/__dsh-desktop/health`), boot URL, spawn helpers.
  - `dsh-themes/` — VS Code/TextMate themes: store + Open VSX catalog, `/themes.json` route, browser bundle, `dsh theme` CLI (shipped, boot-verified).
  - `dsh-formatters/` — LSP-based format-on-edit (scaffolded).
  - `dsh-tools/` — config-file custom tools (scaffolded).
  - `dsh-agents/` — custom agent files (JSON/MD) (scaffolded).
  - `dsh-repos/` — repo workflows (PR/commit), consuming GitHub credentials (scaffolded).
- `scripts/dsh` — launcher: checks current state home, adjusts to configured root, execs the harness binary. Routes plugin verbs: `accounts` (dsh-credentials), `stats`/`sessions`/`share` (dsh-tweaks), `theme` (dsh-themes).

## State

- `DSH_HOME` = `~/.agents` by default (configurable via `dsh-tweaks` `homeRoot`).
- The state folder is never committed.
