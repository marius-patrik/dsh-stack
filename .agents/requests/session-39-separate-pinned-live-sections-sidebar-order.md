# Session 39: Separate Pinned and Live Sections in Sidebar Tree

## Request
**User Prompt:**
> "actually there should be separate pinned and live sections one for each so its pinned active hosts ungrouped archived"

## Scope & Ordering
Structure the sidebar tree sections in the exact requested order:
1. **Pinned** (`📌 Pinned`): Shows pinned/starred chat sessions (stored in `dsh_pinned_sessions` / localStorage, toggleable via Pin/Unpin actions).
2. **Active** (`⚡ Active` / Live): Shows active running agent chat sessions, active attached tmux terminals, and running containers.
3. **Hosts** (`🖥️ Hosts`): Top-level Host Machine -> Macintosh HD (Drive) -> root filesystem directories & folder-nested chats.
4. **Ungrouped** (`📁 Ungrouped`): Uncategorized chats that are not pinned, not active, and not folder-nested.
5. **Archived** (`📦 Archived`): Collapsible section for archived chats at the bottom.

## Implementation Details
- `plugins/dsh-providers/client.js`:
  - Add `PinGlyph` (pin icon) and `ActiveGlyph` (pulse/activity icon).
  - Add `isPinnedOpenState` (default `true`) and `isActiveOpenState` (default `true`).
  - Compute `pinnedSessions` from `dsh_pinned_sessions` / `isPinnedSession`.
  - Compute `activeChatSessions`, `liveSessions` (tmux), `liveContainers` (docker), and total active count.
  - Exclude pinned sessions from `ungroupedSessions`.
  - Add "Pin Chat" / "Unpin Chat" to the chat row action menu (`…`) and context menu.
  - Render the 5 sections in sequence: Pinned -> Active -> Hosts (Host Machine / Drive) -> Ungrouped -> Archived.
