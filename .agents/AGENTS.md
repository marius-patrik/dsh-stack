# AGENTS.md

## Canonical rule files

Each standing rule below also exists as its own individually addressable file
under `.agents/rules/`, one file per rule. Reference a single rule by its file
(e.g. `.agents/rules/branch-and-merge-policy.md`) instead of quoting a slice of
this document. This file still carries the full text of every rule; the split
into `.agents/rules/` is the canonical per-rule addressing layer, and whether
this document later becomes a generated index over those files is a separate,
still-open decision (#60).

## Repository mission

`dsh-stack` is a distributable extension stack for DeepSeek Harness. The upstream `harness/` submodule is pinned and pristine. Stack owns the complete implementation catalog in `src/packages/` and the composed plugin tree in `publish/plugins/`.

## Canonical structure

- `src/packages/` is the canonical flat implementation layer. Every concrete implementation exists exactly once here. Packages may import from other packages; there is no restriction against packages depending on one another.
- `src/scripts/` is verification and release tooling, plus the `dsh` launcher/service-manager script and its aliases.
- `publish/plugins/` is the full composition/catalog tree. It imports canonical implementations from `src/packages/` and does not duplicate implementation source.
- `publish/packs/` is a folder under `publish/`, sibling to `publish/plugins/`/`publish/extensions/`, holding pack aliases/compositions only; it is not a pnpm workspace member on its own right (packs are, however, real pnpm workspace packages under `publish/packs/*`).
- `publish/extensions/` is a folder under `publish/`, sibling to `publish/plugins/`/`publish/packs/`, holding extension implementations (see the plugin/extension/pack model below).
- `.agents/notes/` is the canonical documentation root.
- `README.md`, `AGENTS.md`, and `CLAUDE.md` at repository root are all symlinks to `.agents/AGENTS.md`.
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

| Profile | Purpose |
| --- | --- |
| `@dsh-stack/profile-default` | general Stack experience |
| `@dsh-stack/profile-coding` | coding, repositories, tools, editor/LSP and absorbed DarkFactory capabilities |
| `@dsh-stack/profile-trading` | research, backtesting, optimization and absorbed MoneyMaker capabilities |
| `@dsh-stack/profile-skyblock` | SkyBlock capabilities absorbed from SkyAgent |

## UI

The Stack shell uses DSH-native slots. The sidebar provides Files, file-row actions, profile selection, configurable New Conversation/logo visibility, skins, coherent collapsed/expanded behavior, and unified workspace/tab concepts. VS Code icons are an independent extension. DeepSeek, Claude and Codex skins are independent extensions.

## Credentials and agents

Credentials support typed secrets such as API keys, passwords, TOTP/QR provisioning, OAuth, passkeys, recovery codes, SSH keys, certificates and generic notes. Agents use DSH's native preset primitive; personas are durable session state independent from session actions.

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm verify
pnpm test
```

## Web UI boundary

The intended separate web UI base is `zhu1090093659/dsh-web-ui`, default branch `dev`. Its tab implementation is the reference/base for the Stack web UI. `zhu1090093659/DSH-better-sidebar` is a separate sidebar reference. Do not copy either project into `dsh-stack` as a second implementation.

## CI node architecture

CI automation is intended to run on a real DSH node managed through `dsh-hosts`, not on a bare GitHub runner installation. The node must boot the complete Stack, synchronize repository/node state through `dsh-hosts`, select the `headless` profile, and expose the GitHub Actions runner as one node capability. Credentials remain outside the repository.

## Documentation

`.agents/notes/PRD.md` is the canonical product requirements document. Keep current architectural decisions in `.agents/notes/` and do not create a second documentation root.

New architecture-decision docs and PRD sections for a capability must land in the same pull request as the code that introduces that capability. Documentation describes what shipped, not what is planned.

## Branch and merge policy

- `main` is the only release branch.
- Every feature branch merges through a pull request into `main`.
- Pull requests must have green Canonical Stack workspace, Format repository, and Merge enforcement checks.
- Pull requests must contain the current `main` tip before merge.
- Merged same-repository branches are automatically cleaned up.
- Before a pull request merges, everything it touched must be scoped in attached issue(s): deferred work, follow-ups, or scope discovered mid-PR that isn't fully resolved in the PR gets its own linked GitHub issue, not an implicit or undocumented gap.
- A pull request's description must precisely describe everything the PR actually did — an accurate, complete account of the changes, not a vague or partial summary.

## File and naming granularity

- Avoid monolith files: a source file should generally implement one function (one cohesive unit of behavior), not a grab-bag of unrelated helpers.
- Avoid generic file/module names like `utils`, `helpers`, or `misc`. A name must capture the specific nuance of what the file does, not a catch-all category.

## Release model

The Stack version increments on every merge to `main`. Releases contain the complete plugin and pack catalog, with exact versions, dependencies, integrity data, and distributable artifacts for every included package.

## Issue, roadmap, and dispatch policy

- Merged same-repository branches must actually auto-delete: the repository's `delete_branch_on_merge` setting must stay enabled, not just documented as a policy.
- Large or multi-part work is tracked as an `epic`-labeled master issue with a checklist of child issue links, not as one giant issue or one giant PR. Each child issue gets its own worktree and PR.
- Every open issue and PR is kept on the repository's project board (roadmap), and carries an `area:*` label and a `severity:*` label (`critical`/`high`/`low` etc.) so priority is visible without re-deriving it from scratch each session.
- Work with a real dependency chain between packages (e.g. a foundation package other packages build on) uses stacked PRs: land the foundation PR first, then branch dependents from post-merge `main`, not from each other's unmerged branches.
- A UI bug fix or UI-facing feature is not done until verified live in a real browser against a genuinely booted harness — passing typecheck/build/verify/test is necessary but not sufficient proof a UI feature actually works.
- When you stumble on anything out of scope — a defect, dead or duplicated code, a missing capability, an unenforced rule — file it as an issue (or comment on the existing one) before moving on. A finding recorded only in a session transcript is lost when that session ends.
- When independent, well-scoped execution work can run unattended (a single child issue, a single sub-scope with clear acceptance criteria), prefer dispatching it to a separate execution agent (a background subagent, or the Kimi CLI where available) running in its own worktree, rather than doing it serially in the primary session — this parallelizes throughput and conserves the primary session's own usage budget.

## Verification standard

Completion requires workspace typecheck, workspace build, package-contract verification, duplicate-source verification, placeholder/unchecked-cast/unfinished-code verification, package tests, release packaging/manifest generation, and real user-visible UI wiring. Never weaken a verifier to make CI green; fix the implementation or repository structure.
