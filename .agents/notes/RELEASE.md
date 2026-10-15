# Native release and distribution contract

The repository is a build/release coordinator, not an installer or running application. Every public plugin or native bundle package discovered recursively under `packages/**/package.json` is independently versioned and distributed as an npm package. Shared child bundles are stored only once even if included by several bundle DAG parents. The repository does not publish or manage profile templates.

## Artifacts

A release includes the Stack version, every package and bundle name and version, exact Stack dependency graph, DSH/runtime peer requirements, built npm tarballs, hashes/integrity values and one release manifest. Bundle parents include build-generated deterministic patches. Published packages must contain no `workspace:` ranges; release tooling resolves them to exact versions.

## Lifecycle

DSH's native plugin manager and underlying package manager install, update, activate, deactivate, and remove bundles and their dependencies. Stack does not ship a separate updater, package download manager, or profile rewrite tool. Profile overrides remain user-owned. Optional components can be manually activated.

## Publication ordering

Publish dependencies before bundle parents according to the dependency DAG. Release only on `main` after PR gates pass. Do not publish a second release from the release-version commit. Fresh external-DSH install and Web/Headless smoke gates must pass before considering distribution complete.

## Immutable npm package versions

The registry treats each native `@dsh-stack/*` package version as immutable. Any change to the contents of its release tarball—including `repository.directory` after a source-tree relocation—requires a new semver package version and synchronization of its `stack.json` descriptor, when present. Source versions and the Bun lockfile must be updated together in a pull request; a new GitHub release tag alone does **not** bump package versions.

Before creating a GitHub Release, the release workflow builds the native archives and runs the registry preflight. It checks every package in the generated release inventory against published npm SHA-512 integrities, allowing absent versions and byte-identical existing versions but refusing different bytes under an existing version. The publication workflow repeats the immutable-byte check and verifies public-registry installation. Never skip either check to force a release through.
