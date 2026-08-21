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
  - **`core/`** (`@stack/pack-core`): Foundation, Shell & Abstractions Pack:
    - `plugin-manager/` (`@stack/plugin-manager`): Universal plugin registry, DAG resolver & optional dependencies.
    - `providers-registry/` (`@stack/providers-registry`): Provider abstraction, quota probes & model favorites.
    - `integrations-registry/` (`@stack/integrations-registry`): Integrations health & lifecycle registry.
    - `vault-credentials/` (`@stack/vault-credentials`): Encrypted secrets vault & OAuth service.
    - `sidebar-tree/` (`@stack/sidebar-tree`): 5-tier navigation tree with native `.app` icon extraction (`sips`) & strict tri-color palette.
    - `settings-dialog/` (`@stack/settings-dialog`): Draggable/resizable settings modal & navigation rails.
    - `keybindings/` (`@stack/keybindings`): Keyboard shortcuts engine & recorder.
  - **`ux/`** (`@stack/pack-ux`): Presentation, UI & Media Pack:
    - `tab-manager/` (`@stack/tab-manager`): Universal tab bar, split window docking, bottom drawer panel, right-click tab menus.
    - `code-editor/` (`@stack/code-editor`): Monaco-powered multi-file tab editor & split diff viewer.
    - `icon-engine/` (`@stack/icon-engine`): Universal icon resolution pipeline & native app `sips` loader.
      - `packs/lucide-animated/` (`@stack/icon-pack-lucide`): 1,105 animated SVG icon components.
    - `theme-studio/` (`@stack/theme-studio`): VS Code/TextMate themes & Open VSX catalog.
    - `voice-synthesis/` (`@stack/voice-synthesis`): Web Speech API & Whisper neural speech engine.
    - `terminal-client/` (`@stack/terminal-client`): Standalone TUI client binary.
  - **`agents/`** (`@stack/pack-agents`): Cognitive Agent Systems Pack:
    - `personas/` (`@stack/personas`): Agent personas roster & Subagents Dock.
    - `actions/` (`@stack/actions`): Session action modes & tool execution policies.
    - `commands/` (`@stack/commands`): Slash commands engine & input autocomplete.
    - `tools/` (`@stack/tools`): Universal tool registry & MCP connectors (`ctx.tools`).
    - `loops/` (`@stack/loops`): DarkFactory autonomous goal loops.
    - `skills/` (`@stack/skills`): Dynamic agent skill loader (`.agents/skills/`).
    - `translator/` (`@stack/translator`): Cross-provider prompt and session serializer.
  - **`ai/`** (`@stack/pack-ai`): Wire Protocols & Model Dialects Pack:
    - `protocol-dialects/` (`@stack/protocol-dialects`): Wire protocol serializers (OpenAI, Claude, Gemini, Kimi, Code Assist).
  - **`integrations/`** (`@stack/pack-integrations`): Integrations, Sandboxes, Tools & Providers Pack:
    - `tmux-terminal/` (`@stack/tmux-terminal`): tmux session daemon & 16 CLI harnesses (`claude`, `kimi`, `antigravity`, `codex`, `cursor`, `grok`, `hermes`, `ollama`, `github-cli`, `git-cli`, `sapling-cli`, `code-cli`, `bun-cli`, `pnpm-cli`, `npm-cli`, `nvm-cli`).
    - `package-managers/` (`@stack/package-managers`): Multi-runtime engine (Bun, pnpm, npm, yarn, Cargo, uv/pip) & Node version switcher.
    - `code-server/` (`@stack/code-server`): Self-hosted VS Code server manager & iframe proxy.
    - `providers/` (`@stack/pack-direct-providers`): Direct API providers (`openai-api`, `gemini-studio`, `zen-gateway`, `deepseek-official`).
    - `docker-sandbox/` (`@stack/docker-sandbox`): Container sandboxes & logs inspector.
    - `lsp-client/` (`@stack/lsp-client`): Language server protocol client & servers (`typescript`, `python`, `rust`, `golang`, `json-yaml`).
    - `code-formatters/` (`@stack/code-formatters`): Multi-language source formatters.
    - `mesh-hosts/` (`@stack/mesh-hosts`): Tailscale mesh discovery.
  - **`vcs/`** (`@stack/pack-vcs`): Version Control & Forges Pack:
    - `workbench-core/` (`@stack/workbench-core`): Repository workbench, diff viewer & 100% offline local repos.
    - `git-driver/` (`@stack/git-driver`): Git driver (requires `git-cli`).
    - `sapling-driver/` (`@stack/sapling-driver`): Sapling driver (requires `sapling-cli`).
    - `github-forge/` (`@stack/github-forge`): GitHub forge adapter (requires `github-cli`).
    - `gitlab-forge/` (`@stack/gitlab-forge`): GitLab forge adapter.
    - `forgejo-forge/` (`@stack/forgejo-forge`): Forgejo/Gitea self-hosted forge adapter.


## State

- `DSH_HOME` = `~/.agents` by default (configurable via `dsh-tweaks` `homeRoot`).
- The state folder is never committed.
