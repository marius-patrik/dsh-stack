# AGENTS.md

## Repository mission

`dsh-stack` is a distributable extension stack for DeepSeek Harness. The upstream `harness/` submodule is pinned and pristine. Stack owns the complete implementation catalog in `packages/` and the composed plugin tree in `plugins/`.

## Canonical structure

- `packages/` is the canonical flat implementation layer. Every concrete implementation exists exactly once here. Packages may import from other packages; there is no restriction against packages depending on one another.
- `plugins/` is the full composition/catalog tree. It imports canonical implementations from `packages/` and does not duplicate implementation source.
- `packs/` is a root-level folder, sibling to `packages/`/`plugins/`/`extensions/`, holding pack aliases/compositions only; it is not a pnpm workspace.
- `extensions/` is a root-level folder, sibling to `packages/`/`plugins/`/`packs/`, holding extension implementations (see the plugin/extension/pack model below).
- `notes/` is the canonical documentation root.
- `AGENTS.md` and `CLAUDE.md` at repository root are symlinks to `.agents/AGENTS.md`.
- `harness/` is upstream and must not be modified.
- No duplicate implementation tree, compatibility bridge, migration shim, legacy runtime path, or parallel feature owner is allowed.
- A plugin, extension, or pack does not have to correspond 1:1 with a canonical package; the composition tree and the implementation layer are independent axes.

## Plugin, extension, and pack model

The composition tree recomposes around three distinct roles, not one:

- **Plugin** = a pure abstraction/extension-point layer. It defines the contract, registry, or mount point that concrete implementations plug into. A plugin does not itself bundle multiple unrelated concrete feature implementations.
- **Extension** = one individual concrete implementation of a specific feature, plugged into a plugin's abstraction layer. Every actual individual implementation is its own extension — e.g. each skin (Claude, Codex, DeepSeek) is an extension of the skin abstraction; each icon set is an extension of the icon abstraction; each agent preset is an extension of the agent-preset abstraction; each per-tool terminal harness or per-language LSP server is its own extension, not bundled inside one umbrella plugin.
- **Pack** = one per domain: a distribution/composition bundle over a domain's plugins and extensions.

Target end state: one plugin per abstraction, one extension per feature, one pack per domain. When a plugin's canonical package registers several distinct, independently-meaningful capabilities in one `apply()` (multiple unrelated settings sections, multiple unrelated command families, multiple unrelated bundled features), that is a bundling smell — the individual features should split out into separate extensions, leaving the plugin as the abstraction/registry they plug into.

## Plugin and pack contract

Every canonical package follows the common package contract: unique `@dsh-stack/<id>` name, independent semantic version, ESM, explicit exports, publishable files only, appropriate `stack.kind`, globally unique namespaced `stack.id`, explicit required/optional dependencies, and build/typecheck/test/verify scripts. No checked-in generated implementation output is permitted.

A pack is a composition/distribution unit over canonical packages/plugins. Packs do not create duplicate runtime implementations.

## No duplicate or legacy implementations

There is exactly one implementation owner for every feature. Before adding code, locate the existing owner and extend/refactor it. Do not retain old APIs, icon registries, fallback implementations, compatibility bridges, or migration shims merely to preserve an old architecture. Claude and Codex skin-owned UI remain explicit skin ownership exceptions where specified by the product architecture.

## Profiles

The Stack profiles compose packages and plugins rather than embedding feature implementations.

## Web UI boundary

The intended separate web UI base is `zhu1090093659/dsh-web-ui`, default branch `dev`. Its tab implementation is the reference/base for the Stack web UI. `zhu1090093659/DSH-better-sidebar` is a separate sidebar reference. Do not copy either project into `dsh-stack` as a second implementation.

## CI node architecture

CI automation is intended to run on a real DSH node managed through `dsh-hosts`, not on a bare GitHub runner installation. The node must boot the complete Stack, synchronize repository/node state through `dsh-hosts`, select the `headless` profile, and expose the GitHub Actions runner as one node capability. Credentials remain outside the repository.

## Documentation

`notes/PRD.md` is the canonical product requirements document. Keep current architectural decisions in `notes/` and do not create a second documentation root.

## Branch and merge policy

- `main` is the only release branch.
- Every feature branch merges through a pull request into `main`.
- Pull requests must have green Canonical Stack workspace, Format repository, and Merge enforcement checks.
- Pull requests must contain the current `main` tip before merge.
- Merged same-repository branches are automatically cleaned up.
- Before a pull request merges, everything it touched must be scoped in attached issue(s): deferred work, follow-ups, or scope discovered mid-PR that isn't fully resolved in the PR gets its own linked GitHub issue, not an implicit or undocumented gap.
- A pull request's description must precisely describe everything the PR actually did — an accurate, complete account of the changes, not a vague or partial summary.

## Release model

The Stack version increments on every merge to `main`. Releases contain the complete plugin and pack catalog, with exact versions, dependencies, integrity data, and distributable artifacts for every included package.

## Verification standard

Completion requires workspace typecheck, workspace build, package-contract verification, duplicate-source verification, placeholder/unchecked-cast/unfinished-code verification, package tests, release packaging/manifest generation, and real user-visible UI wiring. Never weaken a verifier to make CI green; fix the implementation or repository structure.
