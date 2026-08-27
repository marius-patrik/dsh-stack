# sidebar-preferences

Persistent preference state for the Stack sidebar UI: `showBrandLogo`,
`showNewConversation` and `treeLayout`.

State lives in `localStorage` and changes broadcast over plugin-kit's
cross-bundle channel, because the module is inlined into every client bundle
that imports it and a module-local listener set would only reach the copy that
was mutated.

## Browser half

The package also ships a `dsh.client` bundle whose only job is to publish the
store on the page and announce it (`__dshSidebarPreferences`, plus a
`dsh-stack.sidebar.preferences:installed` event). Client bundles that tsdown
builds inline the store through a normal import; hand-authored bundles that are
concatenated rather than bundled -- `@dsh-stack/providers` -- have no import to
inline and read the published store instead. That keeps one implementation of
the preference state rather than a second reader copied into those bundles.
