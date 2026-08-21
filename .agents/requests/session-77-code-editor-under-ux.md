# Session 77 Request: Code Editor Under the UX Domain

## User Directives (Verbatim)
`/plan I dont see a code editor under ux`

## Architectural Scope & Requirements
1. **Code Editor UI Under `plugins/ux/code-editor/` (`@stack/code-editor`)**:
   - Rich Monaco-powered front-end editor client: multi-file tabs (`type: "file"`), split-view diffs (`type: "diff"`), inline LSP squiggles, symbol outline, minimap, `Cmd+S` save.
   - Injects `['tools', 'icons', 'webServer', 'slots']`.
2. **Coordinated Backend & CLI Integrations**:
   - `plugins/integrations/code-server/`: Self-hosted VS Code Server instance management & proxy.
   - `plugins/integrations/tmux-terminal/code-cli/`: VS Code `code` CLI interactive harness running in tmux.
