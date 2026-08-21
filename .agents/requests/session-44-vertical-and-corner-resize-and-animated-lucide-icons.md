# Session 44: Full Vertical & Corner Settings Window Resize & Animated Lucide React Icons

## Request
**User Prompt:**
> "the settings are only resizable horizontolly should be verticaly as well and full via corner, ALL icons should be animated lucide react icon"

## Tasks
1. **Full Vertical & Corner Resizing for Settings Window**:
   - Upgrade `handleWindowResizePointerDown` to support generous grab hitboxes (32x32px corner handle, 12px bottom and right edge bars).
   - Ensure dynamic vertical height scaling (`min-height: 340px`, up to full viewport `window.innerHeight - 10px`).
   - Ensure `.dsh-tw-panel`, `.dsh-tw-nav`, `.dsh-tw-navList`, `.dsh-tw-content`, and `.dsh-tw-options` all flex and stretch to 100% height dynamically.
   - Synchronize with localStorage width and height keys (`dsh_settings_window_width`, `dsh_settings_window_height`).
2. **ALL Icons Upgraded to Animated Lucide React Icons**:
   - Replace all older boxy 16x16 icon shapes with standard Lucide React 24x24 vector icons (stroke 2, round linecap/linejoin).
   - Icons: `Settings` (gear), `SlidersHorizontal` (general), `Palette` (themes), `Keyboard` (keybinds), `Bot` (agents), `Terminal` (commands/terminals), `Blocks` / `Puzzle` (plugins), `Boxes` (containers), `Wrench` (tools), `RefreshCw` (loops), `Layers` (providers/models), `ShieldCheck` (accounts), `Rocket` (deploy), `ChevronRight`, `PanelLeftClose`, `MessageSquare` (chat), `GitBranch` (trajectory), `Download`, `MoreHorizontal` (ellipsis).
   - Ensure every icon component includes `className: 'dsh-icon-animated'` with scale, rotation, and stroke transitions on hover.
