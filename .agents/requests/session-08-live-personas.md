# Request: Live personas implementation (Session 8, Phase 11 C)

> Source: CONTEXT.md session 9 (Aug 16 2026)
> Backfilled: 2026-08-17

## What happened

Implemented PRD §5 Phase C — live persona switching in dsh-agents. Built PersonaController,
PersonaCatalog, persona:policy section, persona projection, /persona command, input-bar
switcher, client bundle with PersonaChip and popupSelect.

## User directives (preserved verbatim)

- Agent Presets splits into Session Modes + Agents; personas are live-switchable
  and fully decoupled from modes (any persona × any mode).
- The session log is the hook for the agent.
- Live persona/selected push is not used — client folds persona state from session.history.

## What was built

- src/types.ts: host types (Session/Agent/PreStepDecision)
- src/controller.ts: PersonaController (PERSONA_SELECTED durable event, foldPersona,
  WeakMap pending, committed/queued/cancelled/noop)
- src/catalog.ts: PersonaCatalog (readdir+parsePersona, get/nameOf/ids)
- src/compose.ts: neutral persona row (text: ''), splicePersona, composeComposition
- src/index.ts: provide personaController + catalog, persona:policy section,
  persona projection, /persona command
- client.js: PersonaChip, /persona popupSelect, inject edges
- check-plugin.mjs: full assertions for controller, catalog, section, projection,
  compose, command, client

## Status

Completed. All targets shipped + pushed.
