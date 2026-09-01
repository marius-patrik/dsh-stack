---
date: 2026-08-27
status: active
---

# Issue, roadmap, and dispatch policy

- Merged same-repository branches must actually auto-delete: the repository's `delete_branch_on_merge` setting must stay enabled, not just documented as a policy.
- Large or multi-part work is tracked as an `epic`-labeled master issue with a checklist of child issue links, not as one giant issue or one giant PR. Each child issue gets its own worktree and PR.
- Every open issue and PR is kept on the repository's project board: **`dsh-stack`, project number 13, owner `marius-patrik`** (`gh project item-add 13 --owner marius-patrik --url <issue-or-pr-url>`) — this is the only project actually linked to this repository (verify via `gh api graphql -f query='{ repository(owner:"marius-patrik", name:"dsh-stack") { projectsV2(first:20) { nodes { number title } } } }'` if in doubt, rather than trusting a remembered number). Each item's `Status` field is kept current with its real state. Every item also carries an `area:*` label and a `severity:*` label (`critical`/`high`/`low` etc.) so priority is visible without re-deriving it from scratch each session.
- Work with a real dependency chain between packages (e.g. a foundation package other packages build on) uses stacked PRs: land the foundation PR first, then branch dependents from post-merge `main`, not from each other's unmerged branches.
- A UI bug fix or UI-facing feature is not done until verified live in a real browser against a genuinely booted harness — passing typecheck/build/verify/test is necessary but not sufficient proof a UI feature actually works.
- When independent, well-scoped execution work can run unattended (a single child issue, a single sub-scope with clear acceptance criteria), prefer dispatching it to a separate execution agent (a background subagent, or the Kimi CLI where available) running in its own worktree, rather than doing it serially in the primary session — this parallelizes throughput and conserves the primary session's own usage budget.
