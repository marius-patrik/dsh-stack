# CI and merge policy

A pull request is mergeable only when the complete required CI suite is green. A missing, pending, cancelled, skipped, or failed required check is not green.

## Required checks

1. **Canonical Stack workspace** — install, typecheck, build, repository verification and tests.
2. **Format repository** — whole-repository formatting through Biome.
3. **Merge enforcement** — verifies that the PR head contains the current `main` and that the canonical checks completed successfully for that exact head.

## Up-to-date policy

Every PR targeting `main` must contain the current `main` commit before merge. A PR that becomes stale fails `Merge enforcement` until synchronized again.

## Formatting

`pnpm format` is the canonical whole-repository formatter and `pnpm format:check` is the local verification command. Biome excludes dependencies and generated/build output (`node_modules`, `dist`, `lib`, `.turbo`, `.next`) while formatting supported source/configuration files throughout the repository.

## Branch lifecycle

Same-repository branches are deleted automatically after their PR is merged. A scheduled reconciliation also removes stale same-repository branches whose PR is already merged. `main` and fork branches are never deleted by the cleanup workflow.

## CI-node architecture

The target CI environment is a full DSH node managed through `dsh-hosts`, synchronized with the repository, running the `headless` profile, and exposing the GitHub runner as a node capability. The node must be reproducible and disposable; credentials remain outside source control.

## Repository administration

GitHub branch protection/rulesets must additionally require `Merge enforcement`, require pull requests, require the branch to be up to date, and prohibit direct pushes to `main`. The current connector does not expose branch-protection mutation, so these settings are only considered active after GitHub itself verifies them.
