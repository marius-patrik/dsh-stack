# Native release and distribution contract

The repository is a build/release coordinator, not an installer or running application. Every public plugin or native bundle package discovered recursively under `plugins/**/package.json` is independently versioned and distributed as an npm package. Shared child bundles are stored only once even if included by several bundle DAG parents. `profiles/` contains non-publishable genuine DSH profile templates.

## Artifacts

A release includes the Stack version, every package and bundle name and version, exact Stack dependency graph, DSH/runtime peer requirements, built npm tarballs, hashes/integrity values and one release manifest. Bundle parents include build-generated deterministic patches. Published packages must contain no `workspace:` ranges; release tooling resolves them to exact versions.

## Lifecycle

DSH's native plugin manager and underlying package manager install, update, activate, deactivate, and remove bundles and their dependencies. Stack does not ship a separate updater, package download manager, or profile rewrite tool. Profile overrides remain user-owned. Optional components can be manually activated.

## Publication ordering

Publish dependencies before bundle parents according to the dependency DAG. Release only on `main` after PR gates pass. Do not publish a second release from the release-version commit. Fresh external-DSH install and Web/Headless smoke gates must pass before considering distribution complete.
