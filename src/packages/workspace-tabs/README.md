# workspace-tabs

The single owner of workspace tab hosting for the Stack shell.

This plugin is the abstraction layer: one tab model, one tab strip, one surface
host and one content registry. The three tab areas -- the main area, the bottom
panel and the secondary sidebar -- are the *same* components rendered with a
different `TabSurfacePlacement`. Only placement, sizing, docking and
collapsibility differ; the tab strip, overflow behaviour, trailing new-tab
button, context menus, tab model, move semantics and empty state are shared.

## Shape

| File | Concern |
| --- | --- |
| `src/workspace-tab.ts` | the tab vocabulary and the shared state shape |
| `src/reduce-workspace-tabs.ts` | the one reducer; a move is a single transition |
| `src/create-workspace-tabs-store.ts` | subscribable store the surfaces render from |
| `src/tab-surface-placement.ts` | the only per-surface differences |
| `src/create-tab-strip.ts` | the one tab strip, including the trailing `+` |
| `src/tab-menu-items.ts` | the one menu derivation, so menus cannot drift |
| `src/create-tab-surface.ts` | the one surface host: chrome, resize, collapse, drop |
| `src/create-empty-surface-picker.ts` | the one empty state |
| `src/create-tab-content-registry.ts` | which tab kinds are hostable, and how they render |

## Ownership of a transfer

Every surface reads one store, so moving a tab is a single `move` dispatch
rather than "remove locally, broadcast, hope a destination catches it". A tab is
therefore always owned by exactly one surface and never by none. A `move` naming
a tab no surface owns throws instead of committing a removal nothing balances.

Any registered tab kind is hostable on any surface. A kind with no registered
renderer says so on the surface rather than rendering an empty panel.

## Hosting the runtime

The package carries no React dependency: `createWorkspaceTabsRuntime` takes the
host's React and the host's shell glyphs, and returns the store, the content
registry and the shared `TabSurface` component to render once per placement.

Two build outputs come from the same `src/`:

- `lib/index.js` -- ESM, for Node-side use and package verification.
- `lib/browser.js` -- a browser IIFE publishing `__dshWorkspaceTabs`, which
  `@dsh-stack/providers` concatenates ahead of its hand-authored client bundle,
  the same mechanism `src/scripts/client-runtime/glyph-factory.js` uses.
