# AGENTS.md

## Repository mission

`dsh-stack` is a distributable extension stack for DeepSeek Harness. The upstream `harness/` submodule is pinned and pristine. Stack owns the complete plugin and pack catalog in `plugins/`.

## Canonical structure

- `plugins/` is the only application/plugin implementation root.
- Every plugin implementation is a flat direct child of `plugins/`.
- `plugins/packs/` contains pack aliases/symlinks only; it never contains an independent implementation.
- `notes/` is the only implementation-documentation root.
- `AGENTS.md` is the only agent-context file at repository root.
- `harness/` is upstream and must not be modified.
- No `packages/` tree, parallel implementation tree, compatibility bridge, migration shim, legacy runtime path, or duplicate feature owner is allowed.

## Plugin and pack contract

Every publishable plugin follows the common package contract: unique `@dsh-stack/<id>` name, independent semantic version, ESM, explicit exports, publishable files only, public publish configuration, `stack.kind` of `plugin` or `pack`, globally unique namespaced `stack.id`, explicit required/optional dependencies, and build/typecheck/test/verify scripts. No checked-in generated implementation output is permitted.

A pack is a composition/distribution alias over canonical plugins. Packs do not create duplicate runtime implementations. A pack alias under `plugins/packs/` must resolve to its canonical flat plugin under `plugins/`.

## No duplicate or legacy implementations

There is exactly one implementation owner for every feature. Before adding code, locate the existing owner and extend/refactor it. Do not retain old APIs, icon registries, fallback implementations, compatibility bridges, or migration shims merely to preserve an old architecture. Claude and Codex skin-owned UI remain explicit skin ownership exceptions where specified by the product architecture.

## Profiles

The Stack profiles are `@dsh-stack/profile-default`, `@dsh-stack/profile-coding`, `@dsh-stack/profile-trading`, and `@dsh-stack/profile-skyblock`. Profiles compose plugins/packs rather than embedding feature implementations.

## Web UI boundary

The intended separate web UI base is `zhu1090093659/dsh-web-ui`, default branch `dev`. Its tab implementation is the reference/base for the Stack web UI. `zhu1090093659/DSH-better-sidebar` is a separate sidebar reference. Do not copy either project into `dsh-stack` as a second implementation. The final web product belongs behind the separate web-UI boundary; Stack owns plugin/runtime contracts and integration seams.

The current GitHub connector has read access to the intended web UI but not fork/push permission. Therefore no fork is claimed as completed until an actual fork exists and is verifiably connected to the Stack integration. Do not invent a fork name or describe the web UI fork as implemented when it is not in the repository state.

## CI node architecture

CI automation is intended to run on a real DSH node managed through `dsh-hosts`, not on a bare GitHub runner installation. The node must boot the complete Stack, synchronize repository/node state through `dsh-hosts`, select the `headless` profile, and expose the GitHub Actions runner as one node capability. Node bootstrap must be reproducible and disposable; credentials remain outside the repository in GitHub Actions secrets or the node's secure environment.

The normal CI sequence remains install → typecheck → build → repository verification → tests. A headless review job may additionally execute DSH review/verification workflows on the provisioned node.

## Documentation

`notes/PRD.md` is the canonical product requirements document. `notes/PLAN.md`, `notes/CONTEXT.md`, `notes/BACKLOG.md`, `notes/BLOCKED.md`, `notes/REWRITE.md`, `notes/SOURCES.md`, and `notes/decisions/` contain implementation planning/history. Keep current architectural decisions in `notes/` and do not create a second PRD elsewhere.

## Branch and merge policy

- `main` is the only release branch.
- `ci/closure-verification` is the authoritative branch for the current closure PR.
- Every feature branch merges through a pull request into `main`.
- Pull requests must have green **Canonical Stack workspace** CI before merge.
- There is no shared `integration` branch.

## Release model

The Stack version increments on every merge to `main`. Each changed plugin/pack receives its own semver bump based on the changes within that package; untouched packages retain their versions. A release builds the complete catalog, publishes every new package version, emits a complete manifest with exact versions/dependencies/integrity data, uploads package artifacts and the manifest to the GitHub release, and updates the remote catalog consumed by the updater plugin.

## Verification standard

Completion requires workspace typecheck, workspace build, package-contract verification, duplicate-source verification, placeholder/unchecked-cast/unfinished-code verification, all package tests, release packaging/manifest generation, and real user-visible UI wiring. Never weaken a verifier to make CI green; fix the implementation or repository structure.

## GitHub/tooling limitations

The available GitHub connector can inspect and mutate public repository content, branches, commits, pull requests, and workflow runs, but it does not expose repository branch-protection/ruleset mutation or repository fork creation. Do not claim those operations are complete without GitHub evidence. Required manual repository administration remains: protect `main`, require pull requests, require the `Canonical Stack workspace` check, require the branch to be up to date, and block direct pushes.
