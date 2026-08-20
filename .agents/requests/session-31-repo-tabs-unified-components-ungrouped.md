# User Request: Unified Row Components, Ungrouped Polish, Blue Folder, Repo Tabs with Custom GitHub Client

- **Date**: 2026-08-20
- **Source**: User prompt
- **Raw Request**: `container and terminal rows should match the styling of the others, everything shoudl use unified components, ungrouped section has bad indentation make it match the rest, allow opening repos as tabs to expose custom github client, ungrouped should use blue colored folder icon`

## Requirements
1. **Unified Row Components**: Unify terminal, container, chat, and directory row styling in the sidebar tree (`.dsh-tree-sessionRow`, 28px height, identical icon/title/action slot structure, smooth hover states).
2. **Ungrouped Section Indentation & Blue Folder Icon**:
   - Header indentation matches directory headers.
   - Child rows (terminals, containers, chats) indent consistently at 24px (matching folder child indentation).
   - Ungrouped header uses a vibrant blue colored folder icon instead of chat icon.
3. **Repo Tabs & Custom GitHub Client**:
   - Repositories can be opened as tabs in the main view area (`TopConversationTabBar`).
   - Repository tab renders a custom Git/GitHub client workbench (branches, commits history, staged/unstaged changes, commit & push, PR review).
4. **Agent Message Bubbles**:
   - Agent messages styled into rounded bubbles with differentiated surface color, subtle border, and elevation shadow.
