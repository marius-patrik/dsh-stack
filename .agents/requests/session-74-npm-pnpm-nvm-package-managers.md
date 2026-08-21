# Session 74 Request: npm, pnpm, nvm, and Runtime Package Manager Integrations

## User Directives (Verbatim)
`/plan npm pnmp nvm and so on integrations`

## Architectural Scope & Requirements
1. **Universal Package Managers & Runtime Engine (`plugins/integrations/package-managers/`)**:
   - Auto-detects project package managers: `pnpm`, `npm`, `yarn`, `bun`, `cargo`, `uv`/`pip`.
   - Node runtime management: parses `.nvmrc` and `.node-version` and switches environment via `nvm`/`fnm`.
   - Model-callable tools: `pm-install`, `pm-run-script`, `pm-add-dependency`, `pm-outdated`, `node-version-switch`.
2. **Dedicated CLI Harnesses Under `tmux-terminal`**:
   - `npm-cli`: npm interactive command execution in tmux.
   - `pnpm-cli`: pnpm workspace / monorepo execution in tmux.
   - `nvm-cli`: Node version manager (`nvm`/`fnm`) environment switching in tmux.
