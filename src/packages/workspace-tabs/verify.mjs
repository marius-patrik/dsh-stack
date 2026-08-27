/**
 * Package verification for the shared workspace tab runtime. The move
 * assertions are the regression guard issue #122 asked for: after any transfer
 * a tab must live on exactly one surface -- never two, and never none.
 */
import assert from "node:assert/strict";
import {
  WORKSPACE_SURFACE_IDS,
  clampSurfaceSize,
  createTabContentRegistry,
  createWorkspaceTabsState,
  createWorkspaceTabsStore,
  moveActionId,
  moveActionTarget,
  reduceWorkspaceTabs,
  surfaceHolding,
  surfaceMenuItems,
  tabMenuItems,
  tabsOnSurface,
  TAB_SURFACE_PLACEMENTS,
  unrenderableTabMessage,
} from "./lib/index.js";

const chat = { id: "chat-main", kind: "chat", title: "Conversation", closable: false };
const term = { id: "term-a", kind: "terminal", title: "term-a", session: "a" };
const repo = { id: "repo-x", kind: "repo", title: "repo-x", path: "/repo/x" };

/** Total number of surfaces currently listing `tabId`. */
function surfaceCount(state, tabId) {
  return WORKSPACE_SURFACE_IDS.filter((surface) => state.order[surface].includes(tabId)).length;
}

let state = createWorkspaceTabsState();
for (const tab of [chat, term, repo]) {
  state = reduceWorkspaceTabs(state, { type: "open", tab, surface: "main" });
}
assert.deepEqual(
  tabsOnSurface(state, "main").map((tab) => tab.id),
  ["chat-main", "term-a", "repo-x"],
);
assert.equal(state.active.main, "repo-x");

// A conversation moved to the bottom panel survives the move (issue #122).
state = reduceWorkspaceTabs(state, { type: "move", tabId: "chat-main", surface: "bottom" });
assert.equal(surfaceCount(state, "chat-main"), 1, "moved tab must exist on exactly one surface");
assert.equal(surfaceHolding(state, "chat-main"), "bottom");
assert.ok(state.tabs["chat-main"], "moved tab must still exist in the tab table");
assert.equal(state.active.bottom, "chat-main");

// Moving on to a third surface, and back, keeps the same invariant every hop.
for (const surface of ["secondary", "main", "bottom", "main"]) {
  state = reduceWorkspaceTabs(state, { type: "move", tabId: "chat-main", surface });
  assert.equal(
    surfaceCount(state, "chat-main"),
    1,
    `exactly one surface after moving to ${surface}`,
  );
  assert.equal(surfaceHolding(state, "chat-main"), surface);
}

// Moving the active tab away hands selection to a neighbour rather than null.
state = reduceWorkspaceTabs(state, { type: "activate", tabId: "term-a" });
state = reduceWorkspaceTabs(state, { type: "move", tabId: "term-a", surface: "secondary" });
assert.ok(state.active.main && state.active.main !== "term-a");
assert.equal(state.active.secondary, "term-a");

// A transfer that cannot name its subject fails loudly instead of dropping it.
assert.throws(
  () => reduceWorkspaceTabs(state, { type: "move", tabId: "ghost", surface: "bottom" }),
  /Cannot move unknown workspace tab/,
);

// Closing siblings only touches the host surface.
let closing = reduceWorkspaceTabs(state, { type: "close-others", tabId: "chat-main" });
assert.deepEqual(
  tabsOnSurface(closing, "main").map((tab) => tab.id),
  ["chat-main"],
);
assert.equal(surfaceHolding(closing, "term-a"), "secondary");

// Retitling reaches every surface at once because there is one tab table.
closing = reduceWorkspaceTabs(closing, { type: "retitle", tabId: "term-a", title: "renamed" });
assert.equal(closing.tabs["term-a"].title, "renamed");

// The store notifies subscribers exactly when the state changes.
const store = createWorkspaceTabsStore(state);
let notifications = 0;
const stop = store.subscribe(() => {
  notifications += 1;
});
store.dispatch({ type: "activate", tabId: "chat-main" });
store.dispatch({ type: "activate", tabId: "chat-main" });
assert.equal(notifications, 1, "a no-op dispatch must not notify");
stop();
store.dispatch({ type: "close", tabId: "repo-x" });
assert.equal(notifications, 1, "unsubscribed listeners must stop receiving notifications");

// Every surface derives its menus from one function, so they cannot drift.
for (const surface of WORKSPACE_SURFACE_IDS) {
  const hosted = reduceWorkspaceTabs(state, { type: "move", tabId: "repo-x", surface });
  const rows = tabMenuItems(hosted, repo, surface);
  const moves = rows.filter((row) => moveActionTarget(row.id));
  assert.equal(
    moves.length,
    WORKSPACE_SURFACE_IDS.length - 1,
    `${surface} offers the other surfaces`,
  );
  assert.ok(!moves.some((row) => row.id === moveActionId(surface)), "no self-move row");
  assert.ok(
    rows.some((row) => row.id === "close"),
    `${surface} can close a closable tab`,
  );
  const overflow = surfaceMenuItems(hosted, surface, false);
  assert.equal(
    overflow.some((row) => row.id === "collapse"),
    TAB_SURFACE_PLACEMENTS[surface].collapsible,
    `${surface} offers a collapse row only when it is collapsible`,
  );
}
assert.ok(!tabMenuItems(state, chat, "main").some((row) => row.id === "close"));

// Sizing is the placement's business and is clamped to the live viewport.
const viewport = { width: 1440, height: 900 };
assert.equal(clampSurfaceSize(TAB_SURFACE_PLACEMENTS.bottom, 10, viewport), 160);
assert.equal(clampSurfaceSize(TAB_SURFACE_PLACEMENTS.bottom, 5000, viewport), 792);
assert.equal(clampSurfaceSize(TAB_SURFACE_PLACEMENTS.secondary, 5000, viewport), 600);

// An unregistered kind reports itself instead of rendering nothing.
const registry = createTabContentRegistry();
registry.register({ kind: "terminal", label: "Terminal", render: () => null, create: () => term });
registry.register({ kind: "diff", label: "Diff", render: () => null });
assert.deepEqual(
  registry.creatable().map((type) => type.kind),
  ["terminal"],
);
assert.equal(registry.get("chat"), undefined);
assert.match(unrenderableTabMessage(chat), /No renderer is registered for "chat" tabs/);

console.log("Workspace tabs verification passed.");
