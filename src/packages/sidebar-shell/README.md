# sidebar-shell

The Stack sidebar shell and its client-side slot integration.

The shell header carries the sidebar options button. Its menu is a view control
and holds exactly one entry — a `Show files` toggle over the file/workspace tree
region (`sidebar.workspaces`). The choice is persisted through
`@dsh-stack/sidebar-preferences`, so it survives reloads and stays in sync with
the same toggle in the Sidebar settings section.
