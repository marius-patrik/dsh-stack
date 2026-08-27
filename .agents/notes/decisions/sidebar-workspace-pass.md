# Sidebar workspace pass

Status: implemented

## Decisions

The canonical Stack sidebar has one navigation model.

1. Action buttons sit above the filesystem/workspace tree.
2. The filesystem section is labelled `Files`, not `Workspaces`.
3. Sections are `Pinned`, `Terminals`, `Containers`, `Host Machine`, `Global`, and `Archived`.
4. Host and container section icons use the muted/gray icon tone; ordinary actionable sections retain the normal icon tone.
5. Every filesystem row has a context menu; a directory's context menu is the same New Item menu its `+` button opens.
6. The profile selector sits immediately above Settings in the sidebar footer.
7. Settings contains a normal compact `Profiles` tab for profile configuration; Stack extends the existing DSH settings surface rather than replacing it.
8. A single sidebar preference controls the large New Conversation action. It is not duplicated for collapsed and expanded states.
9. A single sidebar branding preference controls logo visibility in both collapsed and expanded states; the active skin supplies the actual asset.
10. Skins are independent plugins. The initial skins are DeepSeek, Claude and Codex.
11. The tree arrangement is a user preference, not a fixed layout: `sections` gives each group its own separated block, `unified` nests every group under one root with no separators. It persists as `treeLayout` in `@dsh-stack/sidebar-preferences`.

## Groups

`Active` used to be one group listing three unrelated things: running chats, live
terminal sessions and running containers. It is now a `Terminals` group and a
`Containers` group. Chats are not listed a second time in a live group at all --
they stay in the workspaces section they belong to and carry a running indicator
on the row itself.

`Ungrouped` is `Global`: top-level chats that belong to no workspace folder.

## Implementation owner

The sidebar tree -- its groups, its rows and its row context menus -- lives in
`src/packages/providers/client/sidebar-tree/`, concatenated into the
`@dsh-stack/providers` browser bundle by that package's build. That is the tree
the running UI renders, mounted into the harness `sidebar.workspaces` slot.

There is no second sidebar model. The unmounted section list that used to sit in
`@dsh-stack/composition` was deleted rather than kept as a parallel description
of the same thing: a fix landing there changed nothing a user saw.

## Actions never fail quietly

A row action that cannot proceed reports it. The dispatcher in
`session-action-dispatch.js` rejects when a service or a session binding is
absent, and the tree renders the reason above the groups. No action resolves as
though it succeeded when it did nothing.

## Preferences reach hand-authored bundles through their owner

`@dsh-stack/sidebar-preferences` owns the sidebar's preference state. Bundles
tsdown builds inline it. The providers browser bundle is hand-authored and
concatenated, so it cannot inline anything; the preference package therefore
ships a browser half that publishes the one store on the page and announces it.
The hand-authored bundle reads that store rather than carrying a second copy of
the reader.
