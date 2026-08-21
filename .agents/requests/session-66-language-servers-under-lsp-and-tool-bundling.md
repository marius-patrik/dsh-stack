# Session 66 Request: Dedicated Language Servers Below LSP, Real Diagnostics/Tooling & Universal Tool Bundling

## User Directives (Verbatim)
`/plan there should be actually langauge servers below lsp and it should actually do something, everything should bundle relevant tools meaning require tools`

## Architectural Scope & Requirements
1. **Real Language Servers Under `lsp-client/servers/`**:
   - `plugins/integrations/lsp-client/`: Core LSP client engine (JSON-RPC over stdio, document sync, diagnostics store).
   - Language Server Plugins:
     - `servers/typescript/`: Real-time TS/JS diagnostics (`typescript-language-server` / `vtsls`).
     - `servers/python/`: Python typechecking and linting (`pyright` / `pylsp`).
     - `servers/rust/`: Rust symbol resolution and diagnostics (`rust-analyzer`).
     - `servers/golang/`: Go symbol outline and diagnostics (`gopls`).
     - `servers/json-yaml/`: Schema validation for config files.
   - Active Functionality:
     - Monaco Editor: Inline error squiggles, hover signatures, symbol outline.
     - Model Agent Tools: Exposes `lsp-diagnostics`, `lsp-hover`, `lsp-definition`, `lsp-references`.
2. **Universal Tool Bundling (Require `tools`)**:
   - Every integration declares `inject: ['tools', ...]` and registers its model-callable tools via `defineTool`:
     - `vcs/workbench-core` + drivers: `repo-status`, `repo-diff`, `repo-commit`, `repo-push`, `repo-pr`.
     - `lsp-client` + servers: `lsp-diagnostics`, `lsp-hover`, `lsp-find-definition`, `lsp-references`.
     - `docker-sandbox`: `docker-ps`, `docker-exec`, `docker-logs`, `docker-restart`.
     - `tmux-terminal`: `tmux-list`, `tmux-send-keys`, `tmux-capture-pane`.
     - `monaco-editor`: `fs-read`, `fs-write`, `fs-patch`.
     - `code-formatters`: `format-file`, `format-workspace`.
     - `mesh-hosts`: `host-status`, `host-exec`.
