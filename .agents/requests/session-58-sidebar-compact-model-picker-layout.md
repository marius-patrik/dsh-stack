# Request: Sidebar Compact Rail, Model Picker Favorites & Top Alignment

## Directives
1. **Collapsed Sidebar**: When sidebar is collapsed, render the compact rail with expand button so it can easily be reopened.
2. **Model Picker Favorites & Row Spacing**: Fix favorite star click handler, persist in localStorage, pin favorites to top, and remove extra whitespace at row ends.
3. **Model Picker Icon**: Ensure model picker trigger button has standard animated Lucide icon.
4. **Sidebar Rows Flow from Top**: Align all sidebar tree rows from the top immediately below the header, leaving only Settings at the bottom.
5. **Hide Empty Pinned Section**: Hide the "PINNED" section completely when `pinnedChats.length === 0`.
