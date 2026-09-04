---
date: 2026-09-04
status: active
---

# Repository hygiene

Repository state is self-consistent, and a scheduled sweep enforces it rather
than trusting that every event fired.

- A non-`main` remote branch is either backed by an open pull request, or it is
  deleted. Pushing a branch as a backup, with no pull request, is not a
  supported state.
- Every open issue and pull request is on board 13, carries an `area:*` and a
  `severity:*` label, and has a Status. Items labelled `type:idea` are parked
  rather than scoped, and are exempt from the label requirement.
- Board Status is a projection of repository state, reconciled in both
  directions, including terminal states: merged or closed means `Done`.
- A local worktree whose branch or pull request is gone is pruned.

## Status is derived, never authored

Because reconciliation rederives every Status from scratch, a Status that
nothing in the repository backs cannot survive a sweep. Each value is a
projection of durable state:

| Status | Derived from |
| --- | --- |
| `Done` | the issue or pull request is closed or merged |
| `In Review` | an open non-draft pull request, or an issue linked from one |
| `In Progress` | an open draft pull request, an issue linked from one, or an assigned issue |
| `Blocked` | an open `blocked_by` dependency, or the `blocked` label |
| `Ideas` | open and carrying the `type:idea` label — parked, not yet scoped |
| `Ready` | open, unassigned, unblocked, and carrying both required labels |
| `Backlog` | open but not yet triaged — a required label is missing |

The practical consequences are worth stating plainly, because they change how
the board is used:

- **To mark something blocked, record the block.** Add the `blocked` label or a
  real `blocked_by` dependency. Setting `Blocked` on the board alone is undone
  by the next sweep.
- **To park something as an idea, label it `type:idea`.** An idea is untriaged
  by definition, so it is exempt from the `area:*`/`severity:*` requirement and
  is not reported as a missing-label gap. Real work outranks the marker: assign
  it, open a pull request against it, or block it, and it moves accordingly.
- **To mark something in progress, assign it.** An unassigned issue with no pull
  request is `Ready` no matter how much work is underway, because nothing in the
  repository says otherwise.
- **Triage is what promotes `Backlog` to `Ready`.** An issue missing an `area:*`
  or `severity:*` label is by definition untriaged.

## Branch dispositions

The sweep is allowed to act only where acting cannot lose work:

| Branch | Action |
| --- | --- |
| has an open pull request | left alone |
| `main`, or a namespace owned by other automation (`dependabot/`, `gh-readonly-queue/`, `renovate/`, `revert-`) | left alone |
| last commit inside the 24h grace period | left alone |
| zero commits ahead of `main` | deleted — every commit is already reachable from `main`, so nothing can be lost |
| ahead of `main`, no pull request | a draft pull request is opened, never a deletion |
| distance from `main` unmeasurable | reported for a human |

Deletion is confined to the one case that is provably safe. Work that is ahead
of `main` is surfaced for review, because a branch nobody has proposed is a
review problem, not a cleanup problem.

## Why a sweep and not only hooks

Event-driven automation cannot keep this repository consistent on its own, and
the reason is structural rather than a bug to fix:

- GitHub runs `pull_request` workflows against `refs/pull/N/merge`. A pull
  request with conflicts has no such ref, so it emits **no events at all** —
  not the hygiene sweep, not CI, not format.
- A workflow added today never sees the backlog that predates it.
- A failed run drops its events, and nothing replays them.

Anything that must be true of *every* item therefore needs a reconciler that can
rederive the answer from current truth, independent of which events fired. The
event triggers exist for latency; the schedule exists for completeness.

## Editing the Status field wipes every item's value

`updateProjectV2Field` replaces a single-select field's option set wholesale
rather than appending to it, and **regenerates every option id in the process**.
Items store the id, not the name, so adding one option orphans the stored value
on every item at once — observed here as 172 of 174 items dropping to no Status
from a single mutation adding `Ideas`.

The recovery is the sweep, and this is precisely why Status is derived rather
than authored: one `node src/scripts/sweep-repository-hygiene.mjs` restored all
135 affected items from repository state. Nothing was lost, because nothing was
stored only on the board.

When adding a Status option, pass the complete option list including every
existing one, expect the wipe, and run the sweep immediately afterwards.

## Destructive actions are logged

Branch deletion is a destructive action and follows
[destructive-actions-are-explicit-and-audited.md](destructive-actions-are-explicit-and-audited.md):
every run logs what it acted on, against what target, and why, to the workflow
job summary as well as stdout.
