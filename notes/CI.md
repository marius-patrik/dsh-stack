# CI and merge enforcement

The repository has two independent merge gates:

1. **Canonical Stack workspace** — install, typecheck, build, repository verification and tests.
2. **Format repository** — whole-repository formatting through Biome.

`Merge enforcement` is the final policy check. It fails when the PR head does not contain the current `main` commit and fails unless both required checks have completed successfully for that exact PR head.

## Branch policy

Every PR targeting `main` must contain the current `main` commit before merge. A PR that becomes stale fails `Merge enforcement` until synchronized again.

## Repository protection

The GitHub repository must require `Merge enforcement`, require pull requests, require current branches, and disallow direct pushes to `main`. The workflow is intentionally strict and must not be weakened to accommodate failing or stale PRs.
