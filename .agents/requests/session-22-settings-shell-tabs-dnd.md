# Request: Settings Shell, Mobile Layout, Drag-and-Drop Tabs & Context Menus

**Date:** 2026-08-20  
**Source:** User prompt

## User Directives (Verbatim)
> "make settings sidebar collapsable and resizable, make the main sidebar take up full screen width on mobile size, make the settings window draggable across the screen, add paste cut and so on to right click menu, for relevant items it should show close and rename, the panel plus button context menu is z index below the panel contents, the main conversation area should get its own tab bar at top with the conversation tab with plus buttons with same options and allow dragging items between the panel and main area"

## Breakdown of Tasks

1. **Settings Sidebar Collapsible & Resizable**:
   - Add resize handle to `.dsh-tw-nav` in Settings modal allowing drag-to-resize between 140px and 350px.
   - Add collapse/expand toggle on settings nav rail.
2. **Main Sidebar Full Screen Width on Mobile**:
   - When viewport width <= 768px, expanded sidebar occupies `100vw` full screen overlay with backdrop.
3. **Draggable Settings Modal Window**:
   - Allow dragging the settings modal window across the viewport via header / title drag handle.
4. **Enhanced Right-Click Context Menu (Cut, Copy, Paste, Close, Rename)**:
   - Add Cut, Copy, Paste actions.
   - Dynamically detect target context (chat tab, history row, workspace folder) and offer contextual Close and Rename actions.
5. **Panel Plus Button Context Menu Z-Index Fix**:
   - Elevate dropdown menu z-index (`z-index: 10000`) so it renders cleanly above xterm canvases, containers, and webview frames.
6. **Main Conversation Top Tab Bar & Cross-Panel Drag-and-Drop**:
   - Add top tab bar above the conversation area with Conversation tabs, Plus button dropdown (Conversation, Terminal, Container), tab close buttons.
   - Enable drag-and-drop of tabs between the top tab bar and the bottom panel tab bar to easily arrange views.
