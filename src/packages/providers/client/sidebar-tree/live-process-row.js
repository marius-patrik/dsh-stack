/**
 * Rows for the Containers and Terminals groups (#96): a live terminal
 * session or a running container, each just a click-to-open row with a
 * status dot. Neither carries a context menu today -- that was true before
 * the extraction too (the old mixed "Active" list rendered these with no
 * `onContextMenu` at all), so #98's guarded-no-op fix does not apply here;
 * there is no menu to silently fail.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/live-process-row
 */

/**
 * Build the live-process row renderer bound to one runtime.
 * @param runtime - `{ React, h, glyphs }`.
 * @returns `{ renderTerminalRow, renderContainerRow }`.
 */
function __dshCreateLiveProcessRow(runtime) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;

  /** The shared "alive" status dot both row kinds show. */
  function renderStatusDot() {
    return h("span", {
      style: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#3fb950",
        marginLeft: "auto",
        flexShrink: 0,
        boxShadow: "0 0 5px rgba(63, 185, 80, 0.5)",
      },
    });
  }

  return {
    /**
     * Renders one live terminal session row.
     * @param session - `{ name }` from the tmux sessions poll.
     * @returns the row element.
     */
    renderTerminalRow: function (session) {
      return h(
        "div",
        {
          key: "live-term::" + session.name,
          className: "dsh-tree-sessionRow",
          role: "treeitem",
          style: { paddingLeft: "16px", height: "28px", cursor: "pointer" },
          onClick: function () {
            window.dispatchEvent(
              new CustomEvent("dsh:open-terminal", { detail: { session: session.name } }),
            );
          },
        },
        h(
          "span",
          {
            className: "dsh-tree-slot dsh-tree-icon",
            style: { color: "var(--dsw-alias-primary, #6366f1)" },
          },
          h(glyphs.Terminals, { size: 13 }),
        ),
        h(
          "span",
          { className: "dsh-tree-title", style: { fontSize: "12px" } },
          "Terminal: " + session.name,
        ),
        renderStatusDot(),
      );
    },
    /**
     * Renders one running container row.
     * @param container - `{ id, name, image }` from the docker containers poll.
     * @returns the row element.
     */
    renderContainerRow: function (container) {
      return h(
        "div",
        {
          key: "live-cont::" + container.id,
          className: "dsh-tree-sessionRow",
          role: "treeitem",
          style: { paddingLeft: "16px", height: "28px", cursor: "pointer" },
          onClick: function () {
            window.dispatchEvent(
              new CustomEvent("dsh:open-container", { detail: { id: container.id } }),
            );
          },
        },
        h(
          "span",
          {
            className: "dsh-tree-slot dsh-tree-icon",
            style: { color: "var(--dsw-alias-primary, #6366f1)" },
          },
          h(glyphs.Containers, { size: 13 }),
        ),
        h(
          "span",
          { className: "dsh-tree-title", style: { fontSize: "12px" } },
          "Container: " + (container.name || container.image || container.id.slice(0, 12)),
        ),
        renderStatusDot(),
      );
    },
  };
}
