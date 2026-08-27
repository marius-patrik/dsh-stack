/**
 * The live process row: one running tmux session, or one running container.
 *
 * These two rows were byte-for-byte the same block apart from their glyph,
 * their label prefix and the event they dispatch, and they were rendered side
 * by side inside a single `Active` group. Issue #96 splits that group into a
 * Terminals group and a Containers group; the row itself is one description
 * either way.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/live-process-row
 */

/**
 * Build the live-process renderer for one render pass.
 * @param runtime - the sidebar tree runtime (`h`, glyph set).
 * @param parts - `{ renderTreeRow }`.
 * @returns `renderLiveProcessRow(spec)`.
 */
function __dshCreateLiveProcessRow(runtime, parts) {
  var h = runtime.h;

  /**
   * One running terminal or container.
   * @param spec - `{ key, glyph, label, padLeft, onOpen, onContextMenu, actions }`.
   * @returns the row element.
   */
  function renderLiveProcessRow(spec) {
    return parts.renderTreeRow({
      key: spec.key,
      className: "dsh-tree-sessionRow",
      padLeft: spec.padLeft,
      height: 28,
      icon: h(spec.glyph, { size: 13 }),
      iconStyle: { color: "var(--dsw-alias-primary, #6366f1)" },
      title: spec.label,
      titleStyle: { fontSize: "12px" },
      liveDot: !spec.actions,
      actions: spec.actions,
      onClick: spec.onOpen,
      onContextMenu: spec.onContextMenu ? spec.onContextMenu : undefined,
    });
  }

  return renderLiveProcessRow;
}
