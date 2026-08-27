/**
 * The archived chat row: dimmed, with a one-tap restore beside a menu that
 * restores, renames, or deletes permanently.
 *
 * Archived chats are exactly the rows issue #98 was reported against -- a
 * chat outside the active projection is the case where the session binding is
 * missing, so rename here is the action most likely to be unable to proceed.
 * It runs through the same dispatcher as every other row action and reports
 * rather than swallows.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/archived-chat-row
 */

/**
 * Build the archived-row renderer for one render pass.
 * @param runtime - the sidebar tree runtime (`h`, glyphs, formatters).
 * @param parts - `{ renderTreeRow, renderRowActionsMenu }`.
 * @param controller - the tree controller for this render pass.
 * @returns `renderArchivedChatRow(chat, padLeft)`.
 */
function __dshCreateArchivedChatRow(runtime, parts, controller) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;

  /**
   * One archived chat row.
   * @param chat - the archived session row.
   * @param padLeft - the row's indent in pixels.
   * @returns the row element.
   */
  function renderArchivedChatRow(chat, padLeft) {
    var isCurrent = chat.id === controller.currentSessionId;
    var menuId = "archived-chat::" + chat.id;
    return parts.renderTreeRow({
      key: menuId,
      className: "dsh-tree-sessionRow" + (isCurrent ? " dsh-tree-sessionRowActive" : ""),
      sessionId: chat.id,
      padLeft: padLeft,
      height: 28,
      style: { opacity: 0.75 },
      icon: h(glyphs.chat, { size: 14 }),
      iconStyle: { color: "var(--dsw-alias-label-tertiary)" },
      title: chat.title || "Untitled Chat",
      titleHint: chat.title || "Archived Chat",
      meta: runtime.formatTimeAgo(chat.updatedAt),
      compactMeta: true,
      onClick: function () {
        controller.openChat(chat.id, chat.title);
      },
      onContextMenu: controller.openMenuAt(menuId),
      actions: parts.renderRowActionsMenu({
        menuId: menuId,
        menuTitle: "Archived Actions (…)",
        openMenu: controller.openMenu,
        setOpenMenu: controller.setOpenMenu,
        leadingButtons: [
          {
            key: "restore",
            title: "Restore / Unarchive",
            icon: h(glyphs.restore, { size: 13 }),
            onClick: function () {
              controller.unarchiveChat(chat.id);
            },
          },
        ],
        items: [
          { id: "restore", label: "Restore to Active", icon: h(glyphs.restore, { size: 13 }) },
          { id: "rename", label: "Rename Chat", icon: h(glyphs.edit, { size: 13 }) },
          {
            id: "delete",
            label: "Delete Permanently",
            icon: h(glyphs.trash, { size: 13 }),
            danger: true,
          },
        ],
        onSelect: function (actionId) {
          if (actionId === "restore") controller.unarchiveChat(chat.id);
          else if (actionId === "rename") controller.promptRename("chat", chat);
          else if (actionId === "delete") controller.deleteChatPermanently(chat.id);
        },
      }),
    });
  }

  return renderArchivedChatRow;
}
