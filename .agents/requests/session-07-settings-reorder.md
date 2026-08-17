# Request: Settings reorder + full tabs (Session 7, Phase 11 B)

> Source: CONTEXT.md session 8 (Aug 16 2026)
> Backfilled: 2026-08-17

## What happened

Phase 11 B build round: plugin-owned settings reorder plus full Themes, Session Modes,
and Agents tabs. Every nav row's glyph resolved through the settings.section.icon seat.

## User directives (preserved verbatim)

- Settings nav order: General (0) → Models (10) → Quotas (15) → Session Modes (20)
  → Agents (25) → Themes (30) → Keychain (35) → Plugins (40).
- "Reorder + full new tabs" (plugin-owned reorder + full Themes/Session Modes/Agents
  tabs; harness-owned sections keep natural order).

## What was built

- B1: dsh-quotas settings section 20 → 15 + glyph
- B2: dsh-credentials keychain section 20 → 35 + glyph
- B3: dsh-themes new Themes section (order 30) with live switcher
- B4: dsh-session-modes /session-modes route + client Session Modes section (order 20)
- B5: dsh-agents client Agents section (order 25)
- B6: dsh-tweaks navIcon fallback map + harness glyph registrations

## Status

Completed. Boot-verified against live web profile.
