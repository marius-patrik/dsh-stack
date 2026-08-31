# sidebar-preferences

Persistent preference state for the Stack sidebar UI.

Declares `dsh.client` and provides its single `sidebarPreferences` store as
the cordis `sidebarPreferences` service (`./client`). Consumers
(`sidebar-settings`, `sidebar-shell`) inject `sidebarPreferences` instead of
importing the store as a value, so the page has one change-listener set
instead of one per bundle it used to be inlined into.
