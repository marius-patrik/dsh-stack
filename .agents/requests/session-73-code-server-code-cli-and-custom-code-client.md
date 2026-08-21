# Session 73 Request: Self-Hosted Code Server, Code CLI Under tmux, and Custom Code Client

## User Directives (Verbatim)
`/plan add a self hosted code server integration (vs code custom server) code cli and a custom code client instead of the monaco integration but based on it`

## Architectural Scope & Requirements
1. **Custom Code Client (`plugins/integrations/code-client/`)**:
   - Replaces raw monaco integration with a rich custom Code Client built on top of Monaco core.
   - Features: Multi-file tab editor, split-diff viewer, live LSP squiggles/hover, theme tokenization, dirty buffer tracking, `Cmd+S` save.
2. **Self-Hosted Code Server Integration (`plugins/integrations/code-server/`)**:
   - Dedicated manager for self-hosted VS Code Server (`code-server` / `openvscode-server`).
   - Workspace proxying, port forwarding, and embedded iframe / tab viewer.
3. **Code CLI Harness Under `tmux-terminal` (`plugins/integrations/tmux-terminal/code-cli/`)**:
   - VS Code / code-server CLI (`code`) interactive harness running in tmux.
   - Executes `code <file>`, `code --diff <f1> <f2>`, `code tunnel`.
