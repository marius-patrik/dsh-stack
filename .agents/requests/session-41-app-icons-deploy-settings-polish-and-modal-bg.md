# Session 41: App Icons in Filesystem, Deploy Management in Settings, Settings Polish, and Transparent Modal Backdrop

## Request
**User Prompt:**
> "most .apps dont show icons
> make it so deploy is fully managed in settings
> polish all settings tabs so they allow full configuration and make sure it works
> remove the black background from settings modal"

## Tasks
1. **Application Icons in Filesystem**:
   - Render branded SVG app icons for known macOS / desktop applications (Safari, Chrome, Firefox, Arc, Xcode, VS Code, Cursor, Antigravity, Terminal, iTerm, Slack, Discord, Spotify, Music, Mail, Notes, Finder, System Settings, Docker, Figma, Notion, GitHub Desktop, etc.).
   - Support `.app` directory bundles and `.app` files with custom app glyphs.
2. **Deploy Fully Managed in Settings**:
   - Add a first-class `Deploy` tab with complete deployment management:
     - Worker Node Deployment (Tailscale SSH / SSH) with live deployment logs.
     - Git Remote Deployment & Webhook triggers.
     - Mesh networking & Tailscale Ingress / Public URL mapping.
     - Daemon service restart and status.
3. **Polish All Settings Tabs**:
   - General (Agent persona, permissions, enter key behavior, sidebars, search, reasoning toggles).
   - Plugins (All 16 plugins with status, enable/disable, reload, fiber state).
   - Keybinds (Interactive hotkey recorder).
   - Models & Accounts (Full API keys, models, probes).
   - Appearance, Tools, Terminals, Containers.
4. **Remove Black Background from Settings Modal**:
   - Set `.dsh-tw-mask` to `transparent` so the modal floats cleanly over the workspace without a dark black blackout backdrop.
