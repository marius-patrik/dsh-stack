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
- `harness/` — pinned checkout of `deepseek-ai/deepseek-harness` (only git submodule, source of truth, kept pristine).
- `plugins/` — monorepo plugin packages, directly tracked in this repository:
  - `dsh-actions/` — background jobs, actions, and terminal process execution.
  - `dsh-agents/` — custom agents as JSON/MD persona files materialized as agent presets: base composition spliced, live roster, `/persona` command, `dsh agents` CLI.
  - `dsh-credentials/` — account/credential manager (v2: full vault parity port).
  - `dsh-dialects/` — provider wire-protocol abstraction (bundled: openai, claude, gemini, code-assist).
  - `dsh-formatters/` — per-extension formatter commands: `format` tool + auto-format-on-edit + `dsh formatter` CLI.
  - `dsh-hosts/` — multi-node remote host synchronization.
  - `dsh-loops/` — goal-based deterministic loops and criteria execution.
  - `dsh-lsp/` — LSP server table for the harness LSP seam: `mergeServers`, `Lsp` def + `lsp-stdio`/`tool-lsp` mounts, `dsh lsp` CLI.
  - `dsh-providers/` — LLM provider adapters: 14 routes (5 subscription + 8 API-key + OpenCode Zen); quotas subpackage (QuotaRegistry, web routes, auto-refresh, settings).
  - `dsh-repos/` — repo workflows: branch/commit/push/PR consuming `GITHUB_OAUTH_TOKEN`, `dsh repos` CLI.
  - `dsh-themes/` — VS Code/TextMate themes: store + Open VSX catalog, `/themes.json` route, browser bundle, `dsh theme` CLI.
  - `dsh-tools/` — config-file custom tools: `dsh-tools.tools` map → `ctx.tools` entries, `{name}` placeholders, `dsh tool` CLI.
  - `dsh-translator/` — session and skill schema translation.
  - `dsh-tui/` — standalone TUI client for dsh.
  - `dsh-tweaks/` — harness extension layer: 3-dots conversation menu with view switcher (Chat/Trajectory) and log export, Subagents input dock above input bar, sidebar/workspaces/settings occupants, and plugin-facing seams.
  - `dsh-voice/` — browser speech-to-text & model-assisted TTS engine.
- `scripts/dsh` — launcher: checks current state home, adjusts to configured root, execs the harness binary. Routes plugin verbs: `accounts` (dsh-credentials), `stats`/`sessions`/`share` (dsh-tweaks), `theme` (dsh-themes), `lsp` (dsh-lsp), `formatter` (dsh-formatters), `agents` (dsh-agents).

## State

- `DSH_HOME` = `~/.agents` by default (configurable via `dsh-tweaks` `homeRoot`).
- The state folder is never committed.
