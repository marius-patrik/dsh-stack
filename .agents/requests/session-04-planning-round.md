# Request: Phase 0 planning round — grill + P7+ roadmap (Session 4)

> Source: CONTEXT.md session 4 (Aug 15 2026)
> Backfilled: 2026-08-17

## What happened

Planning-only round. User grilled the approach before any building. Decisions locked
on: TUI (vendor opencode as client-only), Desktop (Tauri thin shell), Themes
(VS Code/TextMate + Open VSX catalog), Formatters (LSP-based), Share links
(self-hosted read-only + opt-in interactive), Observability (stats CLI + web panel),
Session UX (plan/build toggle, undo/redo, slash commands, drag-drop, keybinds).

## User directives (preserved verbatim)

- "plan with me everything" — no execution round, just planning.
- TUI: "cannibalize opencode into a client-only app — vendor opencode's TUI code
  (MIT) into dsh-tui talking to dsh's TS SDK / HTTP+SSE API."
- Themes: "separate plugin, not tweaks" — VS Code/TextMate themes, Open VSX catalog.
- Formatters: "separate plugin, as LSP plugin."
- Share links: "self-hosted /share/:id read-only snapshot by default; opt-in
  interactive mode gated by trustedHosts + a random token."
- Observability: "dsh stats CLI verb + web panel."
- Session UX into tweaks: plan/build toggle, undo/redo, slash commands, drag-drop.
- Partials: GitHub credential → dsh-credentials; PR/commit → dsh-repos;
  config-file tools → dsh-tools; agent files → dsh-agents.
- Repo convention: new plugins public, git submodules.
- Phasing: "planning-only round — the user explicitly deferred all building."

## What was created

- AGENTS.md: doc-sync rule, commit+push per phase, plugin scaffold conventions
- PLAN.md: repo table + 7 planned plugins + P7+ roadmap
- BACKLOG.md: re-keyed rows by owning plugin
- README.md: layout entry for AGENTS.md

## Status

Completed. Phase 0 docs round done.
