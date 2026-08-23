# Release and distribution contract

The Stack root package is the release coordinator. Each `plugins/**` package is independently publishable.

## Versioning

- Stack version increments exactly once for each merge to `main`.
- A plugin/pack version changes only when files owned by that package changed in the merged range.
- Conventional commit intent is interpreted within each package: breaking change → major, feature → minor, otherwise patch.
- Dependency-only changes still bump the dependent package when its published metadata changes.

## Release contents

Every release contains:

- the Stack version;
- every plugin and pack ID and exact version;
- required and optional dependencies with exact versions where resolvable;
- package tarball URLs and integrity hashes;
- profile membership;
- pack membership;
- minimum supported Stack/runtime information.

All newly versioned packages are published publicly. Every package tarball and the complete manifest are attached to the GitHub release.

## Updater

The updater plugin consumes the release manifest/catalog, compares installed package versions, resolves dependency constraints, downloads verified artifacts, and applies updates atomically. A failed update leaves the prior installation usable.

## CI/release ordering

Pull request CI must pass before merge. Release runs only from `main` after the merge. The release workflow must not produce a second release from its own version-bump commit.
