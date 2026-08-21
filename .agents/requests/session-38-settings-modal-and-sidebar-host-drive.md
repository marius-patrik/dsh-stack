# Request: Fix Draggable Settings Window Cutout, Deduplicate Models Tab, and Sidebar Tree Hierarchy (Host Machine & Drive)

**User Directives:**
1. "the draggable settings window is inside the native modal only cutout inside, there is two models tabs in settings"
2. "top level of the sidebar tree should be host machine and then drive"

**Scope & Actions:**
1. Settings window dragging: Remove inner nesting inside `P.Modal` card box. Render full-screen overlay + mask + single draggable `.dsh-tw-panel` dialog via `ReactDOM.createPortal` so dragging translates the window freely across the entire viewport without being clipped by a parent modal box.
2. Deduplicate settings tabs: In `TweaksSettingsRoot`, deduplicate `rawRows` by `id` to ensure only one "Models" tab is displayed.
3. Sidebar Tree Hierarchy: In `UnifiedWorkspacesBrowser`, introduce top-level `Host Machine` root containing `Macintosh HD` (Drive), which contains the `/` filesystem tree and chats. Add `HostMachineGlyph` and `HardDriveGlyph`.
