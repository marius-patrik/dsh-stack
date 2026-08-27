/**
 * One collapsible group of the sidebar tree -- Pinned, Terminals, Containers,
 * Host Machine, Global, Archived -- and the two shapes a group can take.
 *
 * Issue #103 makes the arrangement a user preference rather than a fixed
 * layout, persisted as `treeLayout` in `@dsh-stack/sidebar-preferences`:
 *
 * - `sections` gives each group its own block, separated by a rule. This is
 *   what the sidebar has always looked like.
 * - `unified` drops the section chrome so every group reads as a node of one
 *   continuous tree, indented under a single root.
 *
 * Both shapes render from the same description, which is the point: a group
 * added later works under both without being written twice.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/tree-group
 */

/**
 * Build the group renderer for one render pass.
 * @param runtime - the sidebar tree runtime (`h`).
 * @param parts - `{ renderTreeRow }`.
 * @param controller - the tree controller; `treeLayout` selects the shape.
 * @returns `renderTreeGroup(spec)`.
 */
function __dshCreateTreeGroup(runtime, parts, controller) {
  var h = runtime.h;
  var unified = controller.treeLayout === "unified";

  /**
   * The indent, in pixels, of a node at one depth.
   * @param depth - 0 for a top-level group.
   * @returns the left padding.
   */
  function indentAt(depth) {
    return 8 + depth * 16;
  }

  /**
   * Render one group: its header row, and its children when expanded.
   * @param spec - `{ key, icon, label, badge, open, onToggle, actions, depth, children, separator }`.
   * @returns the group element.
   */
  function renderTreeGroup(spec) {
    var depth = spec.depth || 0;
    return h(
      "div",
      {
        key: spec.key,
        style: {
          display: "flex",
          flexDirection: "column",
          width: "100%",
          flex: "0 0 auto",
          margin: unified ? 0 : "2px 0 4px 0",
          paddingBottom: unified ? 0 : "4px",
          borderBottom:
            unified || spec.separator === false
              ? undefined
              : "1px solid var(--dsw-alias-border-l1)",
        },
      },
      parts.renderTreeRow({
        key: "header",
        className: "dsh-tree-projectRow",
        padLeft: indentAt(depth),
        height: 28,
        ariaExpanded: spec.open,
        style: { fontWeight: depth === 0 ? 600 : 500 },
        icon: spec.icon,
        chevron: { open: spec.open },
        title: spec.label,
        badge: spec.badge,
        onClick: spec.onToggle,
        actions: spec.actions,
      }),
      spec.open
        ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            spec.children,
          )
        : null,
    );
  }

  return { render: renderTreeGroup, indentAt: indentAt, unified: unified };
}
