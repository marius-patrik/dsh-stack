# Session 62 Request: Cursor CLI Agent Harness & Complete CLI Agent Suite Layered Over tmux

## User Directives (Verbatim)
`/plan also should have cursor cli`

## Complete Suite of 6 CLI Agent Harnesses Running Over tmux
1. `claude-harness`: Anthropic Claude Code CLI
2. `kimi-harness`: Moonshot Kimi Code CLI
3. `antigravity-harness`: Google Antigravity CLI & Gemini Code Assist
4. `codex-harness`: OpenAI Codex CLI
5. `cursor-harness`: Anysphere Cursor CLI / Cursor Agent
6. `grok-harness`: xAI Grok Build CLI

All 6 CLI agent harnesses declare `inject: ['tmux', 'providers', 'accounts']` and execute inside durable, attachable tmux PTY sessions.
