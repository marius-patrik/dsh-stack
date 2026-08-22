# AGENTS.md

## Repository mission

`dsh-stack` is a distributable extension stack for DeepSeek Harness. The upstream `harness/` submodule is pinned and pristine. Stack owns the complete plugin and pack catalog in `plugins/`.

## Canonical structure

- `plugins/` is the only application/plugin implementation root.
- `notes/` is the only implementation-documentation root.
- `AGENTS.md` is the only agent-context file at repository root.
- `harness/` is upstream and must not be modified.
- No `packages/` tree, parallel implementation tree, compatibility bridge, migration shim, legacy detector, or legacy runtime path is allowed.

## Plugin and pack contract

Every publishable `plugins/**/package.json` follows the same package contract:

- unique `@dsh-stack/<id>` package name;
- independent semantic `version`;
- `type: module`;
- explicit `exports`;
- publishable `files` only;
- `publishConfig.access = public`;
- `stack.kind` = `plugin` or `pack`;
- `stack.id` is globally unique and namespaced;
- required and optional Stack dependencies are explicit;
- `build`, `typecheck`, `test`, and `verify` scripts exist;
- no checked-in `lib/`, `dist/`, `node_modules/`, or other generated implementation output.

Shared mechanics belong in support-library packages. User-visible features and every external integration remain independently addressable plugins. Packs compose plugins; they do not create fake runtime services.

## No duplicate implementations

There is exactly one implementation owner for every feature. Before adding code, locate the existing owner and extend/refactor it rather than creating a second path. Do not retain old APIs simply for migration compatibility. No bridge code, legacy detection, aliases, or fallback implementations may be introduced.

## Profiles

The Stack profiles are `@dsh-stack/profile-default`, `@dsh-stack/profile-coding`, `@dsh-stack/profile-trading`, and `@dsh-stack/profile-skyblock`. Profile IDs are namespaced and profiles compose plugins/packs rather than embedding feature implementations.

## Documentation

`notes/PRD.md` is the canonical product requirements document. `notes/PLAN.md`, `notes/CONTEXT.md`, `notes/BACKLOG.md`, `notes/BLOCKED.md`, `notes/REWRITE.md`, `notes/SOURCES.md`, and `notes/decisions/` contain implementation planning/history. Keep current architectural decisions in `notes/` and do not create a second PRD elsewhere.

## Branch and merge policy

- `main` is the only release branch.
- Work is performed on a dedicated feature branch.
- Every feature branch merges through a pull request into `main`.
- Pull requests must have green **Canonical Stack workspace** CI before merge.
- Every merge to `main` creates exactly one Stack release.
- There is no shared `integration` branch.

## Release model

The Stack version increments on every merge to `main`. Each changed plugin/pack receives its own semver bump based on the changes within that package; untouched packages retain their versions. A release builds the complete catalog, publishes every new package version, emits a complete manifest with exact versions/dependencies/integrity data, uploads package artifacts and the manifest to the GitHub release, and updates the remote catalog consumed by the updater plugin. The Stack release always describes every plugin and pack, not only the changed ones.

## Verification standard

Completion requires all of the following:

1. workspace typecheck passes;
2. workspace build passes;
3. package-contract verification passes;
4. duplicate-source verification passes;
5. placeholder/unchecked-cast/unfinished-code verification passes;
6. all package tests pass;
7. release packaging/manifest generation succeeds;
8. user-visible UI is wired to real DSH seams and has no placeholder state.

Never weaken a verifier to make CI green; fix the implementation or the repository structure.

## GitHub/tooling limitations

The available GitHub connector can inspect and mutate public repository content, branches, commits, pull requests, and workflow runs, but it does not expose repository branch-protection/ruleset mutation. An agent must not claim that `main` is protected or that required status checks are enforced unless GitHub Settings/API evidence actually confirms it. The required manual configuration is: protect `main`, require pull requests, require the `Canonical Stack workspace` check, require the branch to be up to date, and block direct pushes.

The connector also does not expose repository archival/visibility mutation for arbitrary repositories. When an absorbed source repository must be archived, record it in `notes/SOURCES.md` and apply the archive action through GitHub administration when available; do not claim archival until verified.
