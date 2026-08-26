---
date: 2026-08-26
session: kimi takeover (session_17c7d58e)
issues: [82]
status: scoped
---

## Automated screenshots on PRs for any UI changes

> file: automated screenshots on prs for any ui changes

### Semantic decomposition

- New issue #82 (`type:request`, `severity:high`, `area:ci-automation`): a CI workflow on the self-hosted runners that boots the PR build's full-stack harness headlessly, drives a real browser through the primary surfaces, posts screenshots to the PR, and fails on client load errors.
- Motivation observed live this session: PR #63 passed typecheck/verify/HTTP-level checks while the browser showed "Failed to load plugins" and an empty sidebar — only real browser verification caught it.
- Becomes the enforcement arm of the standing rule: every implemented function fully exposed via UI, browser-verified via workflow before merge (`.agents/rules/results-verified-in-live-ui.md`).
- Depends on #63 (bootable full-stack profile) and shares headless-boot infrastructure with the #79 routing epic.
