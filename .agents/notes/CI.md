# CI and merge enforcement

## Executable checks

- **Canonical Stack workspace** installs the locked dependency graph, builds,
  typechecks, verifies and tests the first-party workspace.
- **Format repository** formats with the Biome version selected by `bun.lock`
  and rejects a dirty resulting tree.
- **Browser verification** boots native DSH composition and checks UI
  integration and profile installation.
- **Merge enforcement** verifies that a pull request head contains the latest
  `main` commit. It does not substitute for required-check branch rules.

## Repository protection

GitHub branch rules must require pull requests, up-to-date heads and the
relevant verified check contexts before merging to `main`. They must prevent
direct pushes, forced updates and deletion of the protected branch. A workflow
file alone cannot impose branch protection; configuration and verification are
tracked in #350.

Failed checks are not bypassed to merge a change. An unexecutable governance
check must be repaired at its source (#295) while preserving its fail-closed
behavior.
