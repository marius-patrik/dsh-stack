# AGENTS.md

## Purpose

`dsh-stack` is a distributable extension stack for DeepSeek Harness. The repository contains the complete plugin and pack catalog in `plugins/`, with `harness/` pinned as the upstream runtime.

## Repository rules

- `plugins/` is the only application/plugin implementation root.
- Every plugin and pack is a publishable package with its own semantic version.
- Every package follows the same package contract: `package.json`, `src/`, `tsconfig.json`, build/typecheck/test/verify scripts, public publish metadata, and explicit Stack metadata.
- Shared mechanics belong in support-library packages; user-facing behavior and external integrations belong in separate plugins.
- A plugin may require or optionally depend on other plugins and may be included in packs.
- Do not add compatibility bridges, migration shims, legacy detection, duplicate implementations, or parallel implementations.
- The `harness/` submodule is upstream source and remains pristine.
- Project implementation documentation lives under `notes/`. Product requirements are `notes/PRD.md`.
- This file is the only agent-context file at repository root.

## Plugin contract

Each `plugins/<id>/` package must declare:

- a unique package name under `@dsh-stack/*`;
- its own `version`;
- `type: module`;
- `exports` for its public entrypoint;
- `files` containing only publishable source/build assets;
- `publishConfig.access = public`;
- `stack.kind` (`plugin` or `pack`) and `stack.id`;
- required and optional Stack package dependencies explicitly;
- `build`, `typecheck`, `test`, and `verify` scripts.

Packages are independently versioned. A package version changes only when that package changes. The Stack version increments on every release merge.

## Release model

`main` is the release branch. Changes reach `main` only through pull requests from feature branches.

Every merge to `main` creates exactly one Stack release. The release pipeline:

1. determines the next Stack version;
2. determines per-package semantic bumps from the merged changes;
3. updates only modified plugin/pack versions;
4. builds every package;
5. publishes every version that is new;
6. generates a complete Stack release manifest containing every plugin and pack with exact versions and integrity data;
7. uploads every package tarball plus the manifest to the GitHub release;
8. updates the plugin update catalog consumed by the updater plugin.

The Stack release always contains the complete package catalog even when only a subset changed.

## Review standard

Do not declare work complete because code exists. The canonical workspace must pass typecheck, build, package contract verification, duplicate-source verification, package tests, and release packaging. User-visible UI must be wired to actual DSH seams and must not be simulated with placeholder state.

## Tooling and GitHub-operation limitations

The agent environment can inspect public GitHub repositories, branches, pull requests, commits, workflow runs, and repository files, and can create/update branches, commits, files, and pull requests when the available connector exposes the corresponding operation.

Some GitHub administration operations are not exposed by the available connector and therefore cannot be truthfully claimed as completed by an agent. In particular:

- repository branch-protection/ruleset administration is not exposed as a mutation operation here; the agent must record this limitation rather than claiming that `main` is protected;
- required status-check enforcement, required-PR settings, merge restrictions, and other repository-level rules must be verified in GitHub repository Settings after an authorized maintainer applies them when the connector cannot mutate them;
- repository visibility/archival and other organization/account-level administration may similarly require the GitHub web UI or an unavailable administrative API operation;
- the absence of an exposed mutation tool is not evidence that the repository is configured incorrectly; it means the agent cannot safely assert or change that configuration from this environment.

When one of these limitations blocks a requested repository-level policy, document the exact manual/admin action needed here and continue with all code, CI, release, and documentation work that can be performed directly.
