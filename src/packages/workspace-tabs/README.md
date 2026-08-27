# workspace-tabs

Workspace tab state and navigation components for Stack interfaces.

`reduceWorkspaceTabs` is the single owner of tab and pane transitions.

## Moving a tab

```ts
state = reduceWorkspaceTabs(state, {
  type: "move",
  tabId: "a",
  targetPaneId: "pane-side",
  index: 0,
});
```

A move is one atomic detach-then-insert: the tab is removed from the pane that
currently lists it before it is inserted into `targetPaneId`, so the number of
occupied tab slots never changes and a tab id is never listed by two panes at
once. `index` is the insertion position in the destination as it looks after the
detach and is clamped into range; omit it to append. Targeting the pane the tab
already lives in reorders that pane.

`open` follows the same rule. Opening a tab that is already open activates it
where it lives, and opening it with an explicit `paneId` that differs from its
current pane relocates it through the move path instead of adding a second copy.
