import assert from "node:assert/strict";
import { test } from "node:test";
import { createWorkspaceTabs, reduceWorkspaceTabs } from "./lib/index.js";

/** Total tab slots across every pane; a move must never change this number. */
const occupiedSlots = (state) =>
  Object.values(state.panes).reduce((count, pane) => count + pane.tabs.length, 0);

/** Three tabs open in the main pane, then split so `pane-side` exists as a move target. */
const withTwoPanes = () => {
  let state = createWorkspaceTabs();
  state = reduceWorkspaceTabs(state, {
    type: "open",
    tab: { id: "a", kind: "file", title: "a.ts" },
  });
  state = reduceWorkspaceTabs(state, {
    type: "open",
    tab: { id: "b", kind: "file", title: "b.ts" },
  });
  state = reduceWorkspaceTabs(state, {
    type: "open",
    tab: { id: "c", kind: "file", title: "c.ts" },
  });
  return reduceWorkspaceTabs(
    state,
    { type: "split", sourcePaneId: state.mainPaneId, orientation: "vertical" },
    { idFactory: () => "pane-side" },
  );
};

/** Assert tab `a` ended up alone in `pane-side`, with no slot created or lost. */
const assertRelocatedToSide = (after, before) => {
  assert.equal(occupiedSlots(after), occupiedSlots(before));
  assert.deepEqual(after.panes[after.mainPaneId].tabs, ["b", "c"]);
  assert.deepEqual(after.panes["pane-side"].tabs, ["a"]);
};

test("moving a tab to another pane relocates it instead of duplicating it", () => {
  const before = withTwoPanes();
  const after = reduceWorkspaceTabs(before, {
    type: "move",
    tabId: "a",
    targetPaneId: "pane-side",
  });

  assertRelocatedToSide(after, before);
  assert.equal(
    Object.values(after.panes).filter((pane) => pane.tabs.includes("a")).length,
    1,
    "a moved tab must live in exactly one pane",
  );
  assert.deepEqual(Object.keys(after.tabs).sort(), ["a", "b", "c"]);
  assert.equal(after.panes["pane-side"].activeTabId, "a");
});

test("moving the active tab away hands its pane back to a remaining tab", () => {
  let state = withTwoPanes();
  assert.equal(state.panes[state.mainPaneId].activeTabId, "c");
  state = reduceWorkspaceTabs(state, { type: "move", tabId: "c", targetPaneId: "pane-side" });
  assert.equal(state.panes[state.mainPaneId].activeTabId, "b");
});

test("moving a tab inside its own pane reorders without changing the tab count", () => {
  const before = withTwoPanes();
  const after = reduceWorkspaceTabs(before, {
    type: "move",
    tabId: "c",
    targetPaneId: before.mainPaneId,
    index: 0,
  });

  assert.equal(occupiedSlots(after), occupiedSlots(before));
  assert.deepEqual(after.panes[after.mainPaneId].tabs, ["c", "a", "b"]);
});

test("a move index outside the pane is clamped into range", () => {
  const before = withTwoPanes();
  const high = reduceWorkspaceTabs(before, {
    type: "move",
    tabId: "a",
    targetPaneId: before.mainPaneId,
    index: 99,
  });
  const low = reduceWorkspaceTabs(before, {
    type: "move",
    tabId: "a",
    targetPaneId: "pane-side",
    index: -5,
  });

  assert.deepEqual(high.panes[high.mainPaneId].tabs, ["b", "c", "a"]);
  assert.deepEqual(low.panes["pane-side"].tabs, ["a"]);
  assert.equal(occupiedSlots(high), occupiedSlots(before));
  assert.equal(occupiedSlots(low), occupiedSlots(before));
});

test("opening an already-open tab into another pane moves it rather than copying it", () => {
  const before = withTwoPanes();
  const after = reduceWorkspaceTabs(before, {
    type: "open",
    tab: before.tabs.a,
    paneId: "pane-side",
  });

  assertRelocatedToSide(after, before);
});

test("re-opening a tab in the pane that already holds it keeps a single entry", () => {
  const before = withTwoPanes();
  const after = reduceWorkspaceTabs(before, {
    type: "open",
    tab: { id: "a", kind: "file", title: "a.ts (renamed)" },
  });

  assert.equal(occupiedSlots(after), occupiedSlots(before));
  assert.deepEqual(after.panes[after.mainPaneId].tabs, ["a", "b", "c"]);
  assert.equal(after.panes[after.mainPaneId].activeTabId, "a");
  assert.equal(after.tabs.a.title, "a.ts (renamed)");
});

test("moving an unknown tab or targeting an unknown pane leaves the state untouched", () => {
  const before = withTwoPanes();
  assert.equal(
    reduceWorkspaceTabs(before, { type: "move", tabId: "zz", targetPaneId: "pane-side" }),
    before,
  );
  assert.equal(
    reduceWorkspaceTabs(before, { type: "move", tabId: "a", targetPaneId: "pane-ghost" }),
    before,
  );
});
