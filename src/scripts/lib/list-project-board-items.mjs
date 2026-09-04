/**
 * Reads every item on a project board, keyed by the issue or pull request it
 * tracks.
 *
 * The sweep compares the whole board against the whole repository in one pass,
 * so it reads the board once rather than querying per item.
 *
 * @module @dsh-stack/scripts/list-project-board-items
 */
import { runGh } from "./run-gh.mjs";

/**
 * Lists a board's items indexed by content number.
 *
 * @param {object} board - Which board to read.
 * @param {string} board.owner - Project owner login.
 * @param {number|string} board.number - Project number.
 * @param {string} [board.token] - Token with Projects access.
 * @param {number} [board.limit] - Maximum items to read.
 * @returns {Map<number, {id: string, status: string|null, url: string, type: string}>}
 *   Board items by issue or pull request number. Items tracking no repository
 *   content (draft notes) are omitted, because nothing in the repository can
 *   derive a Status for them.
 */
export function listProjectBoardItems({ owner, number, token, limit = 500 }) {
  const { items } = JSON.parse(
    runGh(
      [
        "project",
        "item-list",
        String(number),
        "--owner",
        owner,
        "--limit",
        String(limit),
        "--format",
        "json",
      ],
      token,
    ),
  );

  const byNumber = new Map();
  for (const item of items) {
    const content = item.content ?? {};
    if (typeof content.number !== "number") continue;
    byNumber.set(content.number, {
      id: item.id,
      status: item.status ?? null,
      url: content.url,
      type: content.type,
    });
  }
  return byNumber;
}
