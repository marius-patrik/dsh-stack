# Session 69 Request: Git CLI & Sapling CLI Under tmux, and Forgejo Self-Hosted Forge

## User Directives (Verbatim)
`/plan git cli spaling as well, add forgeo for self hosted full repos`

## Architectural Scope & Requirements
1. **CLI Harnesses Under `tmux-terminal`**:
   - `git-cli`: Git CLI interactive subprocess harness running in tmux.
   - `sapling-cli`: Sapling (`sl`) CLI interactive subprocess harness running in tmux.
   - `github-cli`: GitHub CLI (`gh`) harness running in tmux.
2. **Dedicated Forgejo / Gitea Self-Hosted Forge (`plugins/vcs/forgejo-forge/`)**:
   - Full support for self-hosted Forgejo and Gitea instances.
   - Pull requests, issues, releases, commits, and server URL resolution via `vault-credentials`.
3. **VCS Driver Wiring**:
   - `git-driver` injects `['git-cli', 'repos', 'tools']`.
   - `sapling-driver` injects `['sapling-cli', 'repos', 'tools']`.
   - `github-forge` injects `['github-cli', 'repos', 'accounts', 'tools']`.
   - `forgejo-forge` injects `['repos', 'accounts', 'tools']`.
