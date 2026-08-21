# Session 61 Request: Packs as Active Cordis Plugins and CLI Harnesses Layered Below tmux

## User Directives (Verbatim)
`/plan packs should also be able to have code themselves basically being plugins - cli based harnesses should be below tmux`

## Architectural Scope & Requirements
1. **Packs as Active Cordis Plugins**:
   - Each pack folder (`plugins/core/`, `plugins/ux/`, `plugins/providers/`, `plugins/ai/`, `plugins/vcs/`, `plugins/integrations/`) is a full Cordis plugin with its own `src/index.ts`, `package.json`, and `check-plugin.mjs`.
   - Packs execute pack-level lifecycle logic, cross-subpackage orchestration, event aggregation, and configuration propagation.
2. **CLI-Based Harnesses Layered Below tmux**:
   - `integrations/tmux-terminal` provides the `ctx.tmux` / `ctx.terminal` PTY and terminal session engine.
   - CLI-based agent harnesses (`claude-harness`, `kimi-harness`, `antigravity-harness`, `codex-harness`, `grok-harness`) declare `inject: ['tmux', 'providers', 'accounts']`.
   - CLI processes run in durable, inspectable tmux sessions that can be attached to directly via the bottom panel or chat UI.
