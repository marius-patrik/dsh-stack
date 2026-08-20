# Request: Session 28 — Repo Icons, Sidebar Alignment, Pinned & Active Section, Purge Legacy Layouts

**Date:** 2026-08-20
**Source:** User prompt

## User Directives

1. **Repo Icon Detection**: Sidebar recognizes git repositories (folders containing `.git` or registered repos) and displays a repo icon instead of a generic folder icon.
2. **Sidebar Indentation Alignment**: Items below a folder must be on the exact same indentation level as sibling subfolders and child items.
3. **Rename Section to "Pinned & Active"**: Rename "Live Sessions" section header to "Pinned & Active".
4. **Purge Legacy Sidebar Layout**: Clicking a terminal in the sidebar must never regress/switch the sidebar to an old layout; purge all legacy sidebar layout code completely so `UnifiedWorkspacesBrowser` is the only sidebar layout.
