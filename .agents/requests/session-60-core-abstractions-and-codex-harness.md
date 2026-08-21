# Session 60 Request: Core Provider & Integration Abstractions, and Codex CLI Harness Integration

## User Directives (Verbatim)
`/plan core should include an integrations and providers abstractions , there should be a codex harness integration via cli`

## Architectural Scope & Updates
1. **Core Abstraction Services in `plugins/core/`**:
   - `providers-registry`: Universal Provider Abstraction, Quota Probes & Model Favorites (`ctx.providers`, `ctx.quotas`).
   - `integrations-registry`: Universal Integrations Abstraction, Health Monitoring & Registry (`ctx.integrations`).
2. **Dedicated Codex CLI Harness (`plugins/providers/codex-harness/`)**:
   - OpenAI Codex CLI subprocess harness integration.
   - Interactive stream parsing, session bridging, token resolution via `vault-credentials`.
3. **Domain Hierarchy**:
   - `plugins/core/`: `plugin-manager`, `providers-registry`, `integrations-registry`, `vault-credentials`, `sidebar-tree`, `tab-windows`, `settings-dialog`, `keybindings`.
   - `plugins/providers/`: `claude-harness`, `kimi-harness`, `antigravity-harness`, `codex-harness`, `grok-harness`, `openai-harness`, `gemini-studio`, `zen-gateway`, `ollama-local`, `deepseek-official`.
