---
date: 2026-08-26
session: kimi-pickup takeover
status: active
---

# Model routing

> clearly limit reset so you can resume them claude limit reset as well so you can split work evenly and utilize appropriate models fit per task - add this as model routing rule below repo

## Rule

Work is split across the available agent CLIs (Claude Code, Kimi CLI) instead of serializing everything on one model, and each task is routed to the model that fits it:

- **Parallelize by default.** Independent scopes run concurrently as detached jobs (tmux + non-interactive `-p` sessions), each in its own worktree on its own branch, each writing a final report file. The driving session reviews, verifies, and merges — jobs open PRs but never merge.
- **Route by task fit.** Long mechanical implementation runs, bulk edits, builds, and verification loops go to whichever CLI has quota headroom. Architecture decisions, code review, browser-driven verification, and ambiguous product judgment stay with the driving session or the stronger-reasoning model.
- **Quota failover.** On a provider quota/limit error, pause that lane and resume it when the limit resets; when the task is model-agnostic, fail over to the other model rather than stalling the pipeline.
- **Resume, don't restart.** A job that dies mid-task is resumed from its artifacts (worktree state, report file, open PR), never restarted from scratch.
