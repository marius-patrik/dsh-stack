# providers

Provider adapters, model catalogs, authentication seams, and quota integrations for DSH Stack.

## Sidebar tree

`client/sidebar-tree/` holds the sidebar tree the running UI renders -- its
groups (`Pinned`, `Terminals`, `Containers`, `Host Machine`, `Global`,
`Archived`), the rows they list, and the row context menus. The build
concatenates it ahead of `client.js`, the same way the shared glyph factory is
prepended, and `client.js` hands it the browser primitives it draws with.

One file per concern: `tree-row.js` is the row primitive every node renders
through, `session-grouping.js` is the whole classification rule,
`session-action-dispatch.js` runs row actions and refuses to let one fail
quietly, and `tree-group.js` renders a group in either of the two arrangements
`@dsh-stack/sidebar-preferences` lets a user choose between.
