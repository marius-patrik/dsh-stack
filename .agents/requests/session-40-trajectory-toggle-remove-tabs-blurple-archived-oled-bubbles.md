# Session 40: Trajectory View Toggle Button, Remove Tabs, Blurple Archived Icon, and OLED Respect for Bubbles and Goals

## Request
**User Prompt:**
> "whne 0on trajectoery view the button should change to switch to chat, you didnt remove the tabs, make the archived icon blurple , also incoming message bubbles, goal display and user bubbless dont respect oled"

## Scope & Tasks
1. **Trajectory / Chat View Switcher Button**:
   - When on trajectory view, the header button switches to "Chat" (or "Switch to Chat").
   - When on chat view, the header button shows "Trajectory" (or "Switch to Trajectory").
   - Clicking it toggles between chat view and trajectory view.
2. **Remove Default Tabs**:
   - Hide the tablist tabs (`[class*="tabs"][role="tablist"]`, `[data-slot-entry="tabs"]`, `[data-slot-id="tabs"]`, `[data-slot="conversation.session.header.tabs"]`) completely.
3. **Blurple Archived Icon**:
   - Make `ArchiveBoxGlyph` and the Archived section header icon in `dsh-providers` blurple (`var(--dsw-alias-primary, #6366f1)`).
4. **OLED Mode Respect for Bubbles and Goals**:
   - Incoming assistant message bubbles, user message bubbles, and goal display components must respect pure black/dark OLED styling (`#000000` / `#050505` / `#0a0a0a` / `#141414` / `#1a1a1a` borders) when OLED theme is enabled.
