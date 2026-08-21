# Session 75 Request: Dedicated Bun CLI & Runtime Integration Under tmux

## User Directives (Verbatim)
`/plan bun if you didnt get it`

## Architectural Scope & Requirements
1. **Dedicated Bun CLI Harness (`plugins/integrations/tmux-terminal/bun-cli/`)**:
   - Executes interactive `bun run`, `bun test`, `bun add`, `bun install`, `bun build` in durable tmux PTY sessions.
   - Injects `['tmux', 'tools']` and exports `ctx.bunCli`.
   - Registers model-executable tools into `ctx.tools`: `bun-run-script`, `bun-add-pkg`, `bun-test-run`.
2. **Complete 16-Harness Suite Under `tmux-terminal`**:
   - Agent Harnesses: `claude-harness`, `kimi-harness`, `antigravity-harness`, `codex-harness`, `cursor-harness`, `grok-harness`, `hermes-harness`, `ollama-cli`.
   - VCS & Forge Harnesses: `github-cli`, `git-cli`, `sapling-cli`.
   - Code & Editor Harnesses: `code-cli`.
   - Runtime & Package Manager Harnesses: `bun-cli`, `pnpm-cli`, `npm-cli`, `nvm-cli`.
