# Session 20 — UI polish, plus menus, unified panel tabs, session export menu, and OLED styling

**Date:** 2026-08-20
**Status:** in progress

## Raw user prompt (verbatim)

> the plus button in input baer should be vertically centered and match the send button size, the messafge agent preview text is also not centered, the plus button in panel should have same context memu as plus button in sidebar, remove new workspace button from collapsed sidebar, instead same plus button should be there, make the conversation window a tab of the panel as well so that the panel with tabs is the full ui, remove the selected preset badge from the top of the chat ui since its in the input bar now, hide the download session log button below a three dots context menu, goal badge isnt using oled colors

## Parsed work items

1. **Input bar plus button alignment & sizing** — Vertically center the plus button in the input bar and match the send button size (34px).
2. **Message placeholder/preview text vertical centering** — Vertically center the "Message the agent" draft / placeholder / preview text in the input card.
3. **Panel plus button context menu** — The plus button in the bottom/terminal panel should open the same context dropdown menu as the plus button in the sidebar (New Chat Session, New Terminal Session, New Sandbox Container).
4. **Collapsed sidebar plus button** — Remove the new workspace button from the collapsed sidebar rail; show the unified plus button instead.
5. **Unified panel tabs (full UI)** — Make the conversation window a first-class tab of the panel, so that the panel with tabs provides the full UI (switching between Conversation, Terminals, and Containers).
6. **Remove header preset badge** — Remove the selected agent preset badge from the session header since it is already present in the input bar toolbar.
7. **Three-dots menu for session log download** — Hide the "Session log" download button behind a three-dots (`...`) context menu in the session header utilities.
8. **Goal badge OLED styling** — Update OLED theme overrides so the goal bar/badge uses true OLED background (`#000000`/`#050505`) and border tokens.
