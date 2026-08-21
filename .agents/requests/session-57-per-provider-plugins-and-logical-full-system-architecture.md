# Session 57 Request: Per-Provider Plugins, Provider Packs & Logical Full-System Architecture

## User Directives (Verbatim)
`/plan but keep it logical, there should definitely be kimi code claude code antigravity grok build and so on plugins as well as I said one per every provider`

## Core Requirements & System Architecture
1. **Atomic Per-Provider & Harness Plugins**:
   - `dsh-provider-claude`: Claude Code CLI harness & Anthropic Claude API provider.
   - `dsh-provider-kimi`: Kimi Code CLI harness & Moonshot Kimi API provider.
   - `dsh-provider-antigravity`: Google Antigravity & Gemini Code Assist harness.
   - `dsh-provider-grok`: Grok Build CLI harness & xAI Grok API provider.
   - `dsh-provider-openai`: OpenAI API & ChatGPT Codex Responses API provider.
   - `dsh-provider-gemini`: Google AI Studio Gemini API provider.
   - `dsh-provider-zen`: OpenCode Zen gateway provider.
   - `dsh-provider-ollama`: Local Ollama & Llama.cpp inference provider.
   - `dsh-provider-deepseek`: DeepSeek Official API provider.
2. **Provider Core & Pack**:
   - `dsh-providers`: Universal Provider Registry (`ctx.providers`), Quota Registry (`ctx.quotas`), and Model Picker Favorites UI.
   - `dsh-pack-providers`: Composite pack bundling all provider plugins.
3. **Full Logical Decoupled Architecture**:
   - Shell & Core: `dsh-plugins`, `dsh-credentials`, `dsh-sidebar`, `dsh-tabs`, `dsh-settings-ui`, `dsh-keybinds`.
   - Presentation: `dsh-icons`, `dsh-icons-lucide`, `dsh-themes`, `dsh-voice`, `dsh-tui`.
   - VCS: `dsh-repos`, `dsh-repos-git`, `dsh-repos-sapling`, `dsh-repos-github`, `dsh-repos-gitlab`.
   - Integrations: `dsh-tmux`, `dsh-docker`, `dsh-editor`, `dsh-tools`, `dsh-lsp`, `dsh-formatters`, `dsh-hosts`.
   - Cognitive AI: `dsh-dialects`, `dsh-translator`, `dsh-agents`, `dsh-actions`, `dsh-loops`.
4. **Hierarchical Packs Layer**:
   - `dsh-pack-core`, `dsh-pack-ux`, `dsh-pack-providers`, `dsh-pack-ai`, `dsh-pack-vcs`, `dsh-pack-integrations`, and umbrella `dsh-pack-all`.
