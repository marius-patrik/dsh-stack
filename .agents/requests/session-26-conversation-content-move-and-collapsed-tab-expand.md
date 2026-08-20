# Request: Session 26 — Conversation Content Move with Tab & Auto-Expand Collapsed Panel on Tab Click

**Date:** 2026-08-20
**Source:** User prompt

## User Directives

1. **Conversation tab content moves with tab**: When conversation tab is moved or active in bottom panel, the conversation view/content must properly render in the bottom panel (do not force 38px height when activeView is "chat" in bottom panel, and ensure seamless DOM/view hosting).
2. **Clicking a tab in collapsed panel expands it**: When bottom panel is collapsed (isCollapsed = true), clicking on any tab (terminal, container, conversation) must automatically expand the panel (setIsCollapsed(false)).
