/**
 * The `+` affordance and the menu behind it -- the sidebar's one way to make
 * a new conversation, terminal session, sandbox container, directory or
 * workspace.
 *
 * It appears on the tree header, on every group header, on every directory
 * row and on the collapsed rail. All of those used to carry their own copy of
 * the item list and the selection handler; the rail's copy had already
 * drifted to a shorter list than the tree's.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/new-item-menu
 */

/**
 * Build the new-item menu for one render pass.
 * @param runtime - the sidebar tree runtime (`h`, `SelectDropdownMenu`, glyphs).
 * @param controller - the tree controller for this render pass.
 * @returns `{ items, select, renderButton }`.
 */
function __dshCreateNewItemMenu(runtime, controller) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;
  var SelectDropdownMenu = runtime.SelectDropdownMenu;

  var ITEMS = [
    { id: "chat", label: "Conversation", icon: h(glyphs.chat, { size: 13 }) },
    { id: "terminal", label: "Terminal Session", icon: h(glyphs.terminals, { size: 13 }) },
    { id: "container", label: "Sandbox Container", icon: h(glyphs.containers, { size: 13 }) },
    { id: "new-folder", label: "New Directory…", icon: h(glyphs.folderPlus, { size: 13 }) },
    {
      id: "open-workspace",
      label: "Open Folder as Workspace…",
      icon: h(glyphs.blueFolder, { size: 13 }),
    },
    {
      id: "archive-empty",
      label: "Archive Empty Chats",
      icon: h(glyphs.trash, { size: 13 }),
      danger: true,
    },
  ];

  /**
   * Carry out one menu choice against one directory.
   * @param actionId - the chosen item id.
   * @param path - the directory the choice applies to.
   */
  function select(actionId, path) {
    controller.setPlusMenu(null);
    if (actionId === "chat") controller.startChatIn(path);
    else if (actionId === "terminal") controller.startTerminalIn(path);
    else if (actionId === "container") controller.startContainerIn(path);
    else if (actionId === "new-folder") controller.createDirectoryIn(path);
    else if (actionId === "open-workspace") controller.openFolderAsWorkspace(path);
    else if (actionId === "archive-empty") controller.archiveEmptyChats();
  }

  /**
   * The inline `+` button used everywhere inside the expanded tree.
   * @param targetDir - the directory the menu acts on, or null for the default root.
   * @param anchorKey - identifies which `+` is open.
   * @returns the button and, when open, its menu.
   */
  function renderButton(targetDir, anchorKey) {
    var plusMenu = controller.plusMenu;
    var isOpen = Boolean(plusMenu && (plusMenu === anchorKey || plusMenu.key === anchorKey));
    var path = targetDir || controller.defaultDirectory;
    return h(
      "div",
      { style: { position: "relative", display: "inline-flex", alignItems: "center" } },
      h(
        "button",
        {
          type: "button",
          className: "dsh-tree-actionBtn",
          title: "New Item (+)",
          "aria-label": "New Item",
          onClick: function (event) {
            event.preventDefault();
            event.stopPropagation();
            var rect = event.currentTarget.getBoundingClientRect();
            controller.setPlusMenu(
              isOpen
                ? null
                : {
                    key: anchorKey,
                    pos: {
                      x: Math.max(10, Math.min(window.innerWidth - 200, rect.right - 190)),
                      y: rect.bottom + 4,
                    },
                  },
            );
          },
        },
        h(glyphs.plus, { size: 13 }),
      ),
      isOpen
        ? h(SelectDropdownMenu, {
            open: true,
            position: plusMenu && plusMenu.pos ? plusMenu.pos : null,
            onClose: function () {
              controller.setPlusMenu(null);
            },
            items: ITEMS,
            onSelect: function (actionId) {
              select(actionId, path);
            },
          })
        : null,
    );
  }

  return { items: ITEMS, select: select, renderButton: renderButton };
}
