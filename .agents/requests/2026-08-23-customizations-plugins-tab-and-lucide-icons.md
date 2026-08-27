---
date: 2026-08-23
session: session-68 (recovered from uncommitted stash@{1} on 2026-08-27)
issues: [119, 113, 38]
status: scoped
---

## Exhaustive audit, customizations sections, native Plugins tab, and global lucide-animate icon replacement

> /goal

> still many old icons

> finish all work many things still missing

> finish all work requested by user messages verify against every single message

> plugins tab should be native

> still missing skills scripts hooks

> rename modes to presets

> reimplement commands to actually be commands not actions

> replace actually all icons with the ones from the real lucide-animate package and make them all use the animations from the package

### Recovery note

This record was written during session 68 but never committed. It survived only
inside `stash@{1}` ("session-68 wip: commands/presets/skills icons"), alongside
implementation work against the retired `plugins/dsh-actions/` and
`plugins/dsh-tweaks/` layout. The directives above were therefore untracked from
2026-08-23 until 2026-08-27, when a roadmap audit found the stash.

The stashed implementation is not recoverable — it targets a directory layout the
PR #22 restructure removed — and must be re-derived rather than applied.

### Semantic decomposition

- **Customizations settings sections** — three new surfaces, each an extension of
  the settings abstraction: **Skills** (discover/manage from `~/.agents/skills/`,
  `.agents/skills/`, project skills; frontmatter, description, schema, run/test),
  **Hooks** (git/agent hooks — `pre-commit`, `commit-msg`, `pre-push`, lifecycle;
  executable permission and status), and **Scripts** (launcher/utility scripts in
  `scripts/`, `bin/`, `.agents/scripts/`; run, inspect, describe). None of the
  three exists today. Tracked by #119.
- **Native Plugins settings tab** — embed the harness's own plugin manager rather
  than reimplementing one: registered plugins with real Cordis state (active,
  disabled, failed, fiber health, dependencies, Schemastery config schemas),
  enable/disable with profile persistence and reload. Tracked by #119. Note that
  fiber phase has more than two states, so a pending or unmounted entry must not
  render as failed (#116).
- **Rename Modes to Presets** and **reimplement Commands as real commands**
  (`/command`, description, arguments, runner, terminal trigger) rather than
  aliases over actions. Folded into #38, which already owns unifying
  personas/agents/presets on the harness's native preset primitive.
- **Global lucide-animate icon pass** — replace every legacy SVG and raw icon
  across plugin headers, tabs, settings sections, sidebar trees, menus, dropdowns
  and composer toolbars, and bind each to an authentic `lucide-animate` keyframe.
  The user named the expected keyframe set explicitly; it is captured on #113.
  The bar is "uses the real package's animations", not "has an animated icon
  component".
- **Verification** — the original request asked for every item to be checked
  against all prior user messages via automated headless-browser tests. That is
  the same standard as `.agents/rules/results-verified-in-live-ui.md` and the
  browser-verification gate in #82.
