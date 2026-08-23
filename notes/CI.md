# CI and merge enforcement

The repository has two independent merge gates:

1. **Canonical Stack workspace** — install, typecheck, build, repository verification and tests.
2. **Format repository** — whole-repository formatting through the canonical formatter.

`Merge enforcement` is the final policy check. It fails when the PR head does not contain the current `main` commit and fails unless both required checks have completed successfully for that exact PR head.

## Branch policy

Every PR targeting `main` must be rebased/updated onto the current `main` before merge. A PR that becomes stale fails `Merge enforcement` until synchronized again.

## Required repository setting

GitHub branch protection/rulesets must require the `Merge enforcement` check on `main`, require pull requests, require branches to be up to date, and disallow direct pushes. The repository API available to the automation connector exposes branch protection as disabled but does not expose a write operation for enabling branch protection/rulesets. The workflow therefore implements the check itself, while the final GitHub repository rule must be enabled in repository settings.

Do not weaken `Merge enforcement` to make a PR mergeable. Fix the stale branch or failing required check.
