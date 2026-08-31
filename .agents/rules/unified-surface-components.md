---
date: 2026-08-27
status: active
---

# Unified surface components

Every surface that presents the same concept uses the same components. Only the
topmost level — placement, sizing, docking, collapsibility — differs per surface.

A tab is a tab whether it sits in the main area, the bottom panel, or the
secondary sidebar. So the tab strip, overflow behaviour, new-tab affordance,
context menu, tab model, move semantics and empty state are written once and
parameterised by placement. The same holds for any other repeated concept: a
tree, a settings section, a list row, a dialog.

## Why

Per-surface implementations of one concept do not merely duplicate code, they
**diverge in capability**, and the divergence becomes user-visible as bugs no
individual surface looks responsible for.

Concretely: the bottom panel was its own component that understood only terminal
and container tabs. Moving a conversation into it removed the tab from the main
area and then rendered nothing, destroying an open conversation — not because
the move was wired wrongly, but because the destination was structurally
incapable of holding what was moved. Three parallel host components carried
2,725 lines, 21 separate event listeners and 20 separate tab-state writers
between them.

Under shared components that class of bug cannot occur: any tab type lives in
any surface by construction, and a capability added once is present everywhere.

## How to apply

- Before building a surface, find the existing component for that concept and
  parameterise it. Do not copy it and adjust.
- If a surface "needs its own version", the difference is either genuinely
  topmost-level (placement) — in which case it is a prop — or it is a missing
  capability in the shared component, which is where it belongs.
- A capability that works in one surface and not another is a defect, not a
  scoping decision.

This is the surface-level form of [[no-duplicate-or-legacy-implementations]].
