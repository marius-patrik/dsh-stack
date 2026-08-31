import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(dir, "client-tab-move-protocol.js"), "utf8");

/**
 * The protocol file is a classic script (no import/export) meant to be
 * concatenated ahead of client.js in the shipped bundle. Evaluate the shipped
 * bytes directly against a plain EventTarget rather than re-implementing the
 * logic here, so this test exercises exactly what ships.
 */
function loadProtocol(target) {
  const factory = new Function("target", `${source}\nreturn __dshCreateTabMoveProtocol(target);`);
  return factory(target);
}

/** Logs "ok -" followed by the provided name to the console. */
const ok = (name) => console.log("ok -", name);

// ---- a chat tab moved to "bottom" is refused, not lost ----
{
  const target = new EventTarget();
  const tabMove = loadProtocol(target);
  const chatTab = { id: "chat-1", type: "chat" };

  let bottomAccepted = null;
  tabMove.onMoveRequested("bottom", (tab) => {
    bottomAccepted = tabMove.takeOwnership("bottom", tab);
  });

  let committed = false;
  tabMove.onForeignCommit("top", () => {
    committed = true;
  });

  tabMove.requestMove("bottom", chatTab);

  assert.equal(bottomAccepted, false, "bottom must refuse a chat tab");
  assert.equal(committed, false, "a refused move must never commit");
  ok("chat tab to bottom panel is refused, never removed from its source (#122)");
}

// ---- a terminal tab moved to "bottom" commits exactly once ----
{
  const target = new EventTarget();
  const tabMove = loadProtocol(target);
  const terminalTab = { id: "term-1", type: "terminal" };

  const areas = { top: [terminalTab], bottom: [], right: [] };

  tabMove.onMoveRequested("bottom", (tab) => {
    if (!tabMove.takeOwnership("bottom", tab)) return;
    areas.bottom.push(tab);
  });
  tabMove.onForeignCommit("top", (detail) => {
    areas.top = areas.top.filter((t) => t.id !== detail.id);
  });
  tabMove.onForeignCommit("right", (detail) => {
    areas.right = areas.right.filter((t) => t.id !== detail.id);
  });

  tabMove.requestMove("bottom", terminalTab);

  const presentIn = Object.keys(areas).filter((area) =>
    areas[area].some((t) => t.id === terminalTab.id),
  );
  assert.deepEqual(presentIn, ["bottom"], "a committed tab must live in exactly one area");
  ok("terminal tab moved to bottom panel exists in exactly one area afterward (#122)");
}

// ---- a move request no destination is listening for leaves the tab in place ----
{
  const target = new EventTarget();
  const tabMove = loadProtocol(target);
  const tab = { id: "orphan-1", type: "terminal" };
  let removedFromSource = false;
  tabMove.onForeignCommit("top", () => {
    removedFromSource = true;
  });

  tabMove.requestMove("right", tab);

  assert.equal(removedFromSource, false, "an unanswered request must not remove the source copy");
  ok("a request with no listening destination leaves the tab exactly where it was (#122)");
}

console.log("\ntab-move protocol tests passed");
