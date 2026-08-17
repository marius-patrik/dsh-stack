# Request: Bug fixes, docs restructure, remaining work orientation (Session 13)

> Source: CONTEXT.md session 13 (Aug 17 2026)
> Backfilled: 2026-08-17

## What happened

Fixed three boot bugs, restructured docs into .agents/ subdirectory, added workflow
hooks, identified ALL remaining work.

## Fixes shipped

1. dsh-agents: added id: "persona-chip" to conversation.input.left slot registration
   (harness list slot requires options.id)
2. dsh-tweaks: registered ui-onboarding settings namespace (welcome notice
   acknowledgement was failing)
3. dsh-subscriptions: updated check-plugin.mjs assertion for 2-entry cordis.patch.yml

## Docs restructure

- Moved PLAN/CONTEXT/BACKLOG/README/AGENTS/PRD/BLOCKED from repo root to .agents/
- Updated .gitignore to whitelist .agents/*.md and .agents/hooks/
- Updated AGENTS.md with new layout, hooks section, all 16 plugins

## Workflow hooks added (.agents/hooks/)

- pre-commit: secrets check, check-plugin.mjs staging guard, node_modules block
- commit-msg: verb convention enforcement
- pre-push: runs all plugin check-plugin.mjs suites
- install.sh: symlinks hooks into .git/hooks/

## Key architecture decision

- dsh-tui will be a SEPARATE repo (not cannibalizing privatecode)
- privatecode binary stays untouched since it works
- dsh-tui will be a new standalone TUI client talking to dsh as backend

## Status

Completed. All fixes shipped, docs restructured.
