# Session 65 Request: Providers Structured Under Integrations, and CLI Harnesses Under tmux

## User Directives (Verbatim)
`/plan providers are supposed to be below integrations with the correct ones below tmux`

## Architectural Directory Structure
```
plugins/
  integrations/
    tmux-terminal/
      claude-harness/           (Claude Code CLI running in tmux)
      kimi-harness/             (Kimi Code CLI running in tmux)
      antigravity-harness/      (Google Antigravity CLI running in tmux)
      codex-harness/            (OpenAI Codex CLI running in tmux)
      cursor-harness/           (Cursor CLI / Agent running in tmux)
      grok-harness/             (Grok Build CLI running in tmux)
    providers/
      openai-api/               (Direct OpenAI API Provider)
      gemini-studio/            (Direct Google AI Studio Gemini API Provider)
      zen-gateway/              (Direct OpenCode Zen Multi-Model Gateway)
      ollama-local/             (Direct Local Ollama & Llama.cpp Server)
      deepseek-official/        (Direct DeepSeek Official API Provider)
    docker-sandbox/
    monaco-editor/
    script-tools/
    lsp-client/
    code-formatters/
    mesh-hosts/
```
