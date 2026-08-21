# Session 68 Request: GitHub CLI Under tmux, Required by GitHub Forge, and Full Local Repository Support

## User Directives (Verbatim)
`/plan github cli below tmux required by github forge repos should be fully supported locally as well`

## Architectural Scope & Requirements
1. **GitHub CLI Harness Under `tmux-terminal` (`plugins/integrations/tmux-terminal/github-cli/`)**:
   - `github-cli`: Subprocess & interactive session harness for the GitHub CLI (`gh`).
   - Executes interactive `gh auth`, `gh pr`, `gh issue`, `gh repo` inside durable tmux PTY sessions.
   - Injects `['tmux', 'accounts']` and provides `ctx.githubCli`.
2. **GitHub Forge Requires GitHub CLI (`plugins/vcs/github-forge/`)**:
   - `github-forge` injects `['github-cli', 'repos', 'accounts', 'tools']`.
   - Uses `ctx.githubCli` for GitHub operations with seamless API fallback.
3. **First-Class Local Repository Engine**:
   - `workbench-core`, `git-driver`, and `sapling-driver` fully support 100% offline, local-only repositories:
     - Local repository initialization (`git init`, `sl init`).
     - Local commit history graph, branching, merging, stashing, and unified diff viewer without remote or vault credentials required.
     - Local working tree status and staging/commit workflows.
