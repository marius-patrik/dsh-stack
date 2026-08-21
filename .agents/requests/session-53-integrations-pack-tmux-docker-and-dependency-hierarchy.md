# Session 53 Request: Dedicated tmux & Docker Plugins, Integrations Pack, and Strict Dependency Layering

## User Prompt (Verbatim)
`/plan tmux should be separate so should docker and each harness integration harnesses should require credentials and so on, all of this should require and be below providers in an integrations pack ....`

## Core Requirements & Objectives
1. **Dedicated Atomic Integration Plugins**:
   - `dsh-tmux`: Dedicated plugin for tmux terminal session lifecycle, interactive attachment, and tab rendering.
   - `dsh-docker`: Dedicated plugin for Docker container sandbox management, log streaming, and container lifecycle actions.
   - `dsh-repos`: Dedicated Git & GitHub client integration consuming `dsh-credentials`.
   - `dsh-tools`, `dsh-lsp`, `dsh-formatters`: Dedicated developer tooling integrations.
2. **Layered Dependency Architecture**:
   - Layer 0: `dsh-credentials` (Encrypted Vault, OAuth tokens, accounts service).
   - Layer 1: `dsh-dialects` & `dsh-providers` (Inference adapters, quotas, model routing — requires `dsh-credentials`).
   - Layer 2: `dsh-pack-integrations` (tmux, docker, repos, tools, lsp, formatters, hosts — requires `dsh-credentials` & `dsh-providers`).
   - Layer 3: Orchestration & UX (`dsh-agents`, `dsh-actions`, `dsh-loops`, `dsh-themes`, `dsh-voice`, `dsh-tweaks`).
3. **Plugin Packs & Versioning**:
   - Assemble `dsh-pack-integrations` as the single unified bundle for all host & sandbox integrations.
   - Strict version pinning in `package.json` across all plugins.
   - Enforce PR-only workflow on GitHub with automated SemVer tagging on merge to `main`.
