# AGENTS.md

## Canonical rules

This file describes the repository's governing implementation contract. Smaller,
individually addressable rules live under `.agents/rules/`. Keep both consistent:
a change to a standing rule updates the relevant rule file and this contract.

## Repository mission

DSH Stack is a native DeepSeek Harness extension distribution. DSH owns installation, profile storage/activation, updates, runtime and CLI. Stack owns reusable plugins, declarative bundles, and release artifacts.

## Canonical structure

- `packages/stack/` — publishable full Stack bundle containing its nested native bundles and plugin packages, grouped by composition. Every `package.json` remains an independent package boundary; no parallel `bundles/` or `standalone/` tree.
- `packages/dsh-tui/` — Chimney's external TUI submodule, activated only by the TUI profile and excluded from Stack's Bun build. There is **no** separate headless or TUI Stack bundle; all profiles consume `@dsh-stack/stack`.
- The on-disk bundle hierarchy tracks source ownership; actual activation remains determined by `stack.compose`, native Cordis patches, and DSH user profile state. An optional plugin nested under a bundle is not activated merely by its location.
- `packages/Cognition/` and `packages/DarkFactory/` are independently maintained Git submodules, pinned to upstream `main` revisions. They are excluded from Stack's native npm workspace, build and release until native integration is explicitly implemented.
- `.github/scripts/` owns repository build, verification, release and GitHub automation; its `lib/` contains helpers shared by those scripts. `packages/stack/plugin-kit/` owns only actual reusable plugin development APIs, tests and client build inputs. No root `lib/` or `scripts/` directory is allowed.
- `.agents/notes/` is the documentation root. `README.md` is standalone, and `CONTRIBUTING.md` symlinks directly to `.agents/AGENTS.md`; no root `AGENTS.md` or `CLAUDE.md`.

## Plugins and nested bundles

A plugin contains exactly one implementation and a native npm package manifest. A bundle declares its `dsh.bundle.patch` and `stack.compose` child dependency list in its `package.json`; the generator flattens its child DAG and rejects duplicate loader entries. DSH activates installed bundles through its normal profile package operations.

There is no second runtime composition system, transitional implementation path, aggregate code wrapper, or duplicate package metadata source. The main `@dsh-stack/stack` bundle is composition-only and installable through native DSH.

## No duplicate or legacy implementations

There is exactly one implementation owner for every feature. Before adding code, locate the existing owner and extend/refactor it. Do not retain old APIs, icon registries, fallback implementations, compatibility bridges, or migration shims merely to preserve an old architecture. Claude and Codex skin-owned UI remain explicit skin ownership exceptions where specified by the product architecture.

## Profile ownership

DSH alone owns profiles, profile selection, installed profile state and activation. Stack ships no profile templates, profile manager, browser-side profile selector or profile lifecycle integration. Existing DSH profiles consume Stack's native packages on the user's terms.

## UI

The Stack shell uses DSH-native slots. The sidebar provides Files, file-row actions, configurable New Conversation/logo visibility, skins, coherent collapsed/expanded behavior, and unified workspace/tab concepts. VS Code icons are an independent extension. DeepSeek, Claude and Codex skins are independent extensions.

## Credentials and agents

Credentials support typed secrets such as API keys, passwords, TOTP/QR provisioning, OAuth, passkeys, recovery codes, SSH keys, certificates and generic notes. Agents use DSH's native preset primitive; personas are durable session state independent from session actions.

## Development

```bash
bun install
bun run typecheck
bun run build
bun run verify
bun run test
```

## Web UI boundary

Stack contributes to DSH-native UI slots and services. Shared UI concepts use one
component and one state owner, parameterized by placement. External visual references
are not implementation dependencies or independent client runtimes.

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

## Repository hygiene

Repository state is self-consistent, and a scheduled sweep enforces it rather than trusting that every event fired. A non-`main` remote branch is either backed by an open pull request or deleted; pushing a branch as a backup, with no pull request, is not a supported state. Every open issue and pull request is on board 13, carries an `area:*` and a `severity:*` label, and has a Status. Board Status is a projection of repository state, reconciled in both directions including terminal states — merged or closed means `Done`.

Because reconciliation rederives every Status from scratch, a Status that nothing in the repository backs cannot survive a sweep. To mark something blocked, record the block (`blocked` label or a `blocked_by` dependency); to park something as an idea, label it `type:idea`, which also exempts it from the label requirement, since an idea is untriaged by definition; to mark something in progress, assign it; triage — both required labels — is what promotes `Backlog` to `Ready`.

The sweep deletes only branches with zero commits ahead of `main`, where nothing can be lost. A branch ahead of `main` with no pull request gets a draft pull request, never a deletion, because an unproposed branch is a review problem rather than a cleanup problem.

Event-driven hooks cannot do this alone, and the reason is structural: GitHub runs `pull_request` workflows against `refs/pull/N/merge`, so a conflicting pull request emits no events at all; a workflow added today never sees the backlog predating it; and a failed run drops its events with nothing to replay them. Event triggers exist for latency, the schedule for completeness. Full text: `.agents/rules/repository-hygiene.md`.

## File and naming granularity

- Avoid monolith files: a source file should generally implement one function (one cohesive unit of behavior), not a grab-bag of unrelated helpers.
- Avoid generic file/module names like `utils`, `helpers`, or `misc`. A name must capture the specific nuance of what the file does, not a catch-all category.

## Release model

GitHub release tags coordinate the native plugin and bundle inventory. Individual npm package versions are immutable and change only when their published contents change; each release records exact dependency and integrity data.

## Issue, roadmap, and dispatch policy

- Merged same-repository branches must actually auto-delete: the repository's `delete_branch_on_merge` setting must stay enabled, not just documented as a policy.
- Large or multi-part work is tracked as an `epic`-labeled master issue with a checklist of child issue links, not as one giant issue or one giant PR. Each child issue gets its own worktree and PR.
- Every open issue and PR is kept on the repository's project board: **`dsh-stack`, project number 13, owner `marius-patrik`** (`gh project item-add 13 --owner marius-patrik --url <issue-or-pr-url>`) — this is the only project actually linked to this repository (verify via `gh api graphql -f query='{ repository(owner:"marius-patrik", name:"dsh-stack") { projectsV2(first:20) { nodes { number title } } } }'` if in doubt, rather than trusting a remembered number). Each item's `Status` field is kept current with its real state. Every item also carries an `area:*` label and a `severity:*` label (`critical`/`high`/`low` etc.) so priority is visible without re-deriving it from scratch each session.
- Work with a real dependency chain between packages (e.g. a foundation package other packages build on) uses stacked PRs: land the foundation PR first, then branch dependents from post-merge `main`, not from each other's unmerged branches.
- A UI bug fix or UI-facing feature is not done until verified live in a real browser against a genuinely booted harness — passing typecheck/build/verify/test is necessary but not sufficient proof a UI feature actually works.
- When you stumble on anything out of scope — a defect, dead or duplicated code, a missing capability, an unenforced rule — file it as an issue (or comment on the existing one) before moving on. A finding recorded only in a session transcript is lost when that session ends.
- When independent, well-scoped execution work can run unattended (a single child issue, a single sub-scope with clear acceptance criteria), prefer dispatching it to a separate execution agent (a background subagent, or the Kimi CLI where available) running in its own worktree, rather than doing it serially in the primary session — this parallelizes throughput and conserves the primary session's own usage budget.
- Before dispatching, decompose the issue into small chunks — narrow, sequential, low-ambiguity steps (e.g. "create the section shell", "move content A in", "move content B in", "retire the old registrations") — not one open-ended "implement this issue" prompt. A chunk that still requires real judgment calls, unresolved architecture questions, or live debugging of an inconsistent repro is not junior-dispatchable as scoped; either scope it down further first, or route it to more capable execution (Kimi, or the primary session itself) instead of a junior/headless run.
- Distribute eligible independent work across configured, healthy model routes within their quotas and permissions. Discover available routes through native DSH provider services, not hard-coded account lists or local credential files. Keep credentials private and preserve resumable progress when a route is unavailable.

## Duplication exemptions

The duplicate gate runs at a zero threshold, so `jscpd:ignore-start` is the only way past it. Every exemption states why the repetition is structural, and every one is closed; `bun run verify` enforces both. Exempt the smallest region that needs it, never a whole file — an unclosed marker silences the rest of the file rather than the block it was written for. If the honest reason is "this should be extracted", extract it.

## Unified surface components

Every surface presenting the same concept uses the same components; only the topmost level — placement, sizing, docking, collapsibility — differs. A tab is a tab whether it sits in the main area, the bottom panel, or the secondary sidebar, so the tab strip, context menu, tab model, move semantics and empty state are written once and parameterised by placement. A capability that works in one surface and not another is a defect, not a scoping decision.

## Reachability

Every package must be reachable by the running system through a normal DSH profile row, `dsh.client`, another package dependency/import, or an exposed CLI. Logical grouping folders do not count as reachability. Before implementing, confirm the code you are about to change actually runs.

## Destructive actions

Destroying running work or user state is always a deliberate, separately-presented action, never the cheapest gesture. Closing a terminal or container tab detaches; killing it is its own action. A transfer commits only once a destination has taken ownership. Every destructive server route logs what ran, against what target, and which caller asked.

## No silent no-ops

An action that cannot proceed says so rather than returning as though it succeeded. `x ? doThing() : Promise.resolve()` in a mutating path converts a missing dependency into a lie about the outcome; surface the failure, or disable the control.

## Verification standard

Completion requires workspace typecheck, workspace build, package-contract verification, duplicate-source verification, placeholder/unchecked-cast/unfinished-code verification, package tests, release packaging/manifest generation, and real user-visible UI wiring. Never weaken a verifier to make CI green; fix the implementation or repository structure.

## Persistent agent kernel boundary

See [.agents/rules/persistent-agent-kernel.md](rules/persistent-agent-kernel.md). The agent kernel owns durable identity, append-only events and environment/capability contracts; it does not own DSH profiles, model routing, personas or provider implementations.
