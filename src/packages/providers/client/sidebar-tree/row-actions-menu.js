/**
 * The trailing action tray on a sidebar row: an ellipsis button plus the
 * dropdown it opens, and whatever extra one-tap buttons the row wants beside
 * it.
 *
 * Chat rows, subagent rows and archived rows all used to build this tray by
 * hand, each with its own copy of the button, the open/close bookkeeping and
 * the `SelectDropdownMenu` wiring, differing only in the item list. Only the
 * item list differs here.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/row-actions-menu
 */

/**
 * Build the action-tray renderer bound to one providers client runtime.
 * @param runtime - the sidebar tree runtime (`h`, `SelectDropdownMenu`, glyphs).
 * @returns `renderRowActionsMenu(spec)`.
 */
function __dshCreateRowActionsMenu(runtime) {
  var h = runtime.h;
  var SelectDropdownMenu = runtime.SelectDropdownMenu;
  var Ellipsis = runtime.glyphs.ellipsis;

  /**
   * One small square button in a row's action tray.
   * @param spec - `{ key, title, icon, onClick }`.
   * @returns the button element.
   */
  function renderActionButton(spec) {
    return h(
      "button",
      {
        key: spec.key,
        type: "button",
        className: "dsh-tree-actionBtn",
        title: spec.title,
        onClick: function (event) {
          event.stopPropagation();
          spec.onClick(event);
        },
      },
      spec.icon,
    );
  }

  /**
   * Render one row's action tray.
   * @param spec - `{ menuId, menuTitle, iconSize, items, onSelect, openMenu, setOpenMenu, leadingButtons }`.
   * @returns the tray contents, ready to hand to `renderTreeRow`'s `actions`.
   */
  function renderRowActionsMenu(spec) {
    var isOpen = Boolean(spec.openMenu && spec.openMenu.id === spec.menuId);
    var buttons = (spec.leadingButtons || []).map(renderActionButton);
    buttons.push(
      renderActionButton({
        key: "ellipsis",
        title: spec.menuTitle,
        icon: h(Ellipsis, { size: spec.iconSize || 13 }),
        onClick: function () {
          spec.setOpenMenu(isOpen ? null : { id: spec.menuId });
        },
      }),
    );
    buttons.push(
      h(SelectDropdownMenu, {
        key: "menu",
        open: isOpen,
        position: spec.openMenu && spec.openMenu.pos ? spec.openMenu.pos : null,
        onClose: function () {
          spec.setOpenMenu(null);
        },
        items: spec.items,
        onSelect: spec.onSelect,
      }),
    );
    return buttons;
  }

  return renderRowActionsMenu;
}
