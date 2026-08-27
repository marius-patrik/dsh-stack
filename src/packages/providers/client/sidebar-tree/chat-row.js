/**
 * The chat row -- the sidebar's densest node: pinned state, running state,
 * subagent children, a relative timestamp, and the pin / rename / fork /
 * archive menu reachable from both the ellipsis button and a right-click.
 *
 * Every one of those menu actions runs through the tree's action dispatcher,
 * so an action that cannot proceed says so instead of closing the menu and
 * doing nothing (issue #98).
 *
 * A chat's running state is shown here as a per-row indicator. It used to be
 * shown by listing the chat a second time inside a live `Active` group; that
 * group is gone (issue #96) and chats now live only in the workspaces section
 * they belong to.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/chat-row
 */

/**
 * Build the chat-row renderer for one render pass.
 * @param runtime - the sidebar tree runtime (`h`, glyphs, formatters).
 * @param parts - `{ renderTreeRow, renderRowActionsMenu }`.
 * @param controller - the tree controller for this render pass.
 * @returns `renderChatRow(chat, padLeft)`.
 */
function __dshCreateChatRow(runtime, parts, controller) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;
  var formatTimeAgo = runtime.formatTimeAgo;

  /**
   * One subagent row hanging under its parent chat.
   * @param subagent - the child session row.
   * @param padLeft - the parent's indent; the child sits one step deeper.
   * @returns the row element.
   */
  function renderSubagentRow(subagent, padLeft) {
    var isCurrent = subagent.id === controller.currentSessionId;
    return parts.renderTreeRow({
      key: "sub::" + subagent.id,
      className:
        "dsh-tree-sessionRow dsh-tree-subagentRow" +
        (isCurrent ? " dsh-tree-sessionRowActive" : ""),
      sessionId: subagent.id,
      padLeft: padLeft + 16,
      height: 28,
      style: { color: isCurrent ? "var(--dsw-alias-primary, #6366f1)" : "inherit" },
      icon: h(glyphs.subagent, { size: 12 }),
      title: subagent.title || "Subagent",
      titleHint: subagent.title || "Subagent Session",
      titleStyle: { fontSize: "11.5px" },
      meta: formatTimeAgo(subagent.updatedAt),
      compactMeta: true,
      onClick: function () {
        controller.openChat(subagent.id, subagent.title);
      },
      onContextMenu: controller.openMenuAt("chat::" + subagent.id),
      actions: parts.renderRowActionsMenu({
        menuId: "chat::" + subagent.id,
        menuTitle: "Subagent Actions",
        iconSize: 12,
        openMenu: controller.openMenu,
        setOpenMenu: controller.setOpenMenu,
        items: [
          { id: "rename", label: "Rename Subagent", icon: h(glyphs.edit, { size: 13 }) },
          {
            id: "archive",
            label: "Archive Subagent",
            icon: h(glyphs.trash, { size: 13 }),
            danger: true,
          },
        ],
        onSelect: function (actionId) {
          if (actionId === "rename") controller.promptRename("subagent", subagent);
          else if (actionId === "archive") controller.archiveChat(subagent.id);
        },
      }),
    });
  }

  /**
   * One chat row, with its subagents when expanded.
   * @param chat - the session row.
   * @param padLeft - the row's indent in pixels.
   * @returns the row element and any expanded children.
   */
  function renderChatRow(chat, padLeft) {
    var isCurrent = chat.id === controller.currentSessionId;
    var isPinned = controller.grouping.isPinned(chat, chat.id);
    var subagents = controller.grouping.subagentsOf(chat.id);
    var hasSubagents = subagents.length > 0;
    var isExpanded = Boolean(controller.expandedSubagents[chat.id]);

    return h(
      "div",
      {
        key: "chat-wrapper::" + chat.id,
        style: { display: "flex", flexDirection: "column", width: "100%" },
      },
      parts.renderTreeRow({
        key: "chat::" + chat.id,
        className:
          "dsh-tree-sessionRow" +
          (hasSubagents ? " dsh-has-children" : "") +
          (isCurrent ? " dsh-tree-sessionRowActive" : ""),
        sessionId: chat.id,
        padLeft: padLeft,
        height: 30,
        ariaExpanded: hasSubagents ? isExpanded : undefined,
        style: {
          color: isCurrent ? "var(--dsw-alias-primary, #6366f1)" : "inherit",
          fontWeight: isCurrent ? 600 : 400,
        },
        icon: isPinned ? h(glyphs.pin, { size: 13 }) : h(glyphs.chat, { size: 14 }),
        iconStyle: isPinned ? { color: "var(--dsw-alias-primary, #6366f1)" } : undefined,
        chevron: hasSubagents
          ? {
              open: isExpanded,
              title: isExpanded ? "Collapse subagents" : "Expand subagents",
              onClick: function () {
                controller.toggleSubagentExpand(chat.id);
              },
            }
          : null,
        title: chat.title || "Untitled Chat",
        titleHint: chat.title || "Chat Session",
        badge: hasSubagents
          ? {
              text: subagents.length,
              tone: "accent",
              title: subagents.length + " subagents (click to toggle)",
              onClick: function (event) {
                event.preventDefault();
                event.stopPropagation();
                controller.toggleSubagentExpand(chat.id);
              },
            }
          : null,
        meta: formatTimeAgo(chat.updatedAt),
        liveDot: controller.grouping.isRunning(chat),
        onClick: function () {
          controller.openChat(chat.id, chat.title);
        },
        onContextMenu: controller.openMenuAt("chat::" + chat.id),
        actions: parts.renderRowActionsMenu({
          menuId: "chat::" + chat.id,
          menuTitle: "Chat Actions (…)",
          openMenu: controller.openMenu,
          setOpenMenu: controller.setOpenMenu,
          items: [
            {
              id: isPinned ? "unpin" : "pin",
              label: isPinned ? "Unpin Chat" : "Pin Chat",
              icon: h(glyphs.pin, { size: 13 }),
            },
            { id: "rename", label: "Rename Chat", icon: h(glyphs.edit, { size: 13 }) },
            { id: "fork", label: "Fork Chat", icon: h(glyphs.branch, { size: 13 }) },
            {
              id: "archive",
              label: "Archive Chat",
              icon: h(glyphs.trash, { size: 13 }),
              danger: true,
            },
          ],
          onSelect: function (actionId) {
            if (actionId === "pin" || actionId === "unpin") controller.togglePinned(chat.id);
            else if (actionId === "rename") controller.promptRename("chat", chat);
            else if (actionId === "fork") controller.forkChat(chat.id);
            else if (actionId === "archive") controller.archiveChat(chat.id);
          },
        }),
      }),
      hasSubagents && isExpanded
        ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            subagents.map(function (subagent) {
              return renderSubagentRow(subagent, padLeft);
            }),
          )
        : null,
    );
  }

  return renderChatRow;
}
