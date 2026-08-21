# Request — Session 63 (Tmux Exit Closes Terminal Tab & Composer Toolbar Layout Setting)

## User Directives:
1. `exiting tmux should close terminal tab`
2. `add setting to choose between unified input bar or split toolbar`

## Plan & Execution Scope:
1. **Tmux Exit Closes Terminal Tab**:
   - In `InteractiveTmuxTerminal` (and `MainViewTerminalOccupant`, bottom panel, right dock):
     When the WebSocket receives `session_closed` / `exit` / `EOF` or when the terminal process exits, invoke `onClose()` or dispatch `dsh:close-terminal-tab` with `{ session: sessionName }` to automatically remove the tab and focus the conversation tab.
2. **Composer Toolbar Layout Setting**:
   - In `GeneralSettingsSection` in `plugins/dsh-tweaks/client.js`, add a setting selector for "Composer Toolbar Layout":
     - `Unified Input Bar` (single streamlined row with integrated buttons)
     - `Split Toolbar` (distinct top toolbar row for tools/preset/model and bottom textarea/send)
   - Store in `dsh_composer_toolbar_layout` and toggle `body.dsh-composer-split` / `body.dsh-composer-unified`.
3. **Verify & Sync**:
   - Verify all 80 package checks pass.
