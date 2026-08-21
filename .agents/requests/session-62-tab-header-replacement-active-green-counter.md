# Request — Session 62 (Conversation Header Replacement by Tab Bar, Green Active Counter & Three-Dots Menu in Tab Corner)

## User Directives:
1. `the active counter can be gree nas well`
2. `the tab row should replace the header of the conversation - three dots in tab bar corner and tab with name replacesd name`
3. `its broken`
4. `fix it`
5. `continue`
6. `review it`
7. `not yet`
8. `finish it`
9. `clean it up`
10. `make sure everything is don e`

## Plan & Execution Scope:
1. **Green Active Counter in Sidebar**:
   - In `UnifiedWorkspacesBrowser` (left sidebar), style the "Active (N)" count badge with green accent (`color: #3fb950`, `background: rgba(63, 185, 80, 0.15)` or green dot).
2. **Tab Row Replaces Conversation Header**:
   - `TopConversationTabBar` occupies the top header slot of the conversation workspace.
   - Hide redundant native chat title/header elements (`[data-slot="conversation.header"]` or native title banner) via CSS while preserving controls or integrating them.
   - The active tab with the live chat name acts as the title, and the 3-dots utilities button sits in the top-right corner of the tab bar.
3. **Review & Clean Up**:
   - Ensure seamless layout across Main Area, Bottom Panel, Secondary Sidebar.
   - Verify all 80 package checks pass.
