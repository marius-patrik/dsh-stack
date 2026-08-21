# Session 78 Request: Universal Tab Manager Under UX Domain

## User Directives (Verbatim)
`/plan what about the tab manager`

## Architectural Scope & Requirements
1. **Universal Tab Manager Under `plugins/ux/tab-manager/` (`@stack/tab-manager`)**:
   - Manages top conversation / file / repo / diff tab bar.
   - Cross-pane drag-and-drop docking (split horizontal, split vertical).
   - Bottom collapsible drawer / panel for terminals and sandboxes.
   - Tab context menus: `Close`, `Close Others`, `Close to Right`, `Split Right`, `Split Down`, `Pin Tab`.
   - Injects `['slots', 'sessions', 'icons', 'webServer']`.
2. **Harmonious UX Domain Layout**:
   - `plugins/ux/tab-manager/`: Multi-area tab bar & split window manager.
   - `plugins/ux/code-editor/`: Rich code editor UI (Monaco core).
   - `plugins/ux/icon-engine/`: Icon resolution & native app `sips` loader.
   - `plugins/ux/theme-studio/`: Themes engine & Open VSX marketplace.
   - `plugins/ux/voice-synthesis/`: Speech synthesis & recognition.
   - `plugins/ux/terminal-client/`: Standalone TUI client binary.
