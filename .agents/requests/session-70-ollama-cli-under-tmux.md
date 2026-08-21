# Session 70 Request: Full Ollama CLI Integration Nested Under tmux

## User Directives (Verbatim)
`/plan full ollama cli integration below tmux`

## Architectural Scope & Requirements
1. **Ollama CLI Harness Under `tmux-terminal` (`plugins/integrations/tmux-terminal/ollama-cli/`)**:
   - `ollama-cli`: Full Ollama CLI and server management harness running in tmux.
   - Manages background `ollama serve` daemon, `ollama pull`, `ollama run`, `ollama list`, `ollama ps`.
   - Injects `['tmux', 'providers', 'tools']` and provides `ctx.ollamaCli`.
   - Registers local models (DeepSeek R1 local, Qwen 3, Llama 3) into `ctx.providers` and VRAM/RAM meters into `ctx.quotas`.
   - Exposes model-callable tools: `ollama-list-models`, `ollama-pull-model`, `ollama-status`.
2. **Complete Suite of 10 CLI Harnesses Under `tmux-terminal`**:
   - Agent Harnesses: `claude-harness`, `kimi-harness`, `antigravity-harness`, `codex-harness`, `cursor-harness`, `grok-harness`, `ollama-cli`.
   - VCS & Forge Harnesses: `git-cli`, `sapling-cli`, `github-cli`.
