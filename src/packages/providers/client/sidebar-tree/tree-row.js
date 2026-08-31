/**
 * Chat row rendering for the sidebar tree: a running chat (with its
 * subagents and pin/rename/fork/archive menu) and an archived chat (with its
 * restore/rename/delete menu). Both share one row shell and one context-menu
 * pattern -- right-click or the row's ellipsis button opens the same
 * `SelectDropdownMenu`, positioned at the click or at the button.
 *
 * Rename and fork run through the dispatcher from `session-action-dispatch.js`
 * (`ctx.dispatch`), so a request that cannot be serviced reports instead of
 * doing nothing (#98). Archive, restore and delete combine a local
 * pinned/archived bookkeeping step with the network request (see
 * `session-grouping.js`), so they run through `ctx.onArchiveChat` and
 * `ctx.grouping`'s own restore/delete methods instead, with the same
 * failure-surfacing guarantee.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/tree-row
 */

/**
 * Build the chat-row renderers bound to one runtime.
 * @param runtime - `{ React, h, glyphs, SelectDropdownMenu, formatTimeAgo }`.
 * @returns `{ renderChatRow, renderArchivedChatRow }`.
 */
function __dshCreateTreeRow(runtime) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;
  var formatTimeAgo = runtime.formatTimeAgo;
  var renderRowActionsMenu = __dshCreateRowActionsMenu(runtime);

  /**
   * A row's right-click handler: every row kind opens its context menu at
   * the click position the same way.
   * @param openMenu - the row's own `openMenu(pos)` closure.
   * @returns the `onContextMenu` handler.
   */
  function rowContextMenuHandler(openMenu) {
    return function (event) {
      event.preventDefault();
      event.stopPropagation();
      openMenu({ x: event.clientX, y: event.clientY });
    };
  }

  /**
   * A chat row's click/right-click pair: click opens the chat, right-click
   * opens its context menu. Every chat-shaped row (live, subagent, archived)
   * wires these the same way.
   * @param ctx - the row's ctx (see `renderChatRow`).
   * @param chatLike - the item this row opens, needing `id` and `title`.
   * @param openMenu - the row's own `openMenu(pos)` closure.
   * @returns `{ onClick, onContextMenu }`.
   */
  function chatRowOpenHandlers(ctx, chatLike, openMenu) {
    return {
      onClick: function () {
        ctx.onOpenChat(chatLike.id, chatLike.title);
      },
      onContextMenu: rowContextMenuHandler(openMenu),
    };
  }

  /**
   * The `renderRowActionsMenu` props every row kind's ellipsis trigger
   * shares: where the menu opens, and how it opens/closes. A caller adds
   * `title`, `items` and `onSelect` on top of this.
   * @param ctx - the row's ctx (see `renderChatRow`).
   * @param isOpen - whether this row's menu is currently open.
   * @param openMenu - the row's own `openMenu(pos)` closure.
   * @returns `{ isOpen, position, onToggle, onClose }`.
   */
  function ellipsisTriggerProps(ctx, isOpen, openMenu) {
    return {
      isOpen: isOpen,
      position: ctx.ellipsisOpen && ctx.ellipsisOpen.pos ? ctx.ellipsisOpen.pos : null,
      onToggle: function () {
        if (isOpen) ctx.setEllipsisOpen(null);
        else openMenu(undefined);
      },
      onClose: function () {
        ctx.setEllipsisOpen(null);
      },
    };
  }

  /**
   * The small running-state dot a chat row shows in place of its relative
   * time while the session is busy -- the one visible trace #96 leaves of
   * the old "Active" list once a running chat renders only in its normal
   * group.
   */
  function renderRunningDot() {
    return h("span", {
      "aria-label": "Running",
      title: "Running",
      style: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#3fb950",
        marginRight: "4px",
        flexShrink: 0,
        boxShadow: "0 0 5px rgba(63, 185, 80, 0.5)",
      },
    });
  }

  /**
   * Renders one chat row, its subagents (when expanded) and its context
   * menu.
   * @param chat - the session record.
   * @param padLeft - the row's indent in pixels.
   * @param ctx - `{ currentSessionId, grouping, dispatch, ellipsisOpen,
   * setEllipsisOpen, expandedSubagents, toggleSubagentExpand, onOpenChat,
   * onArchiveChat }`.
   * @returns the row element.
   */
  function renderChatRow(chat, padLeft, ctx) {
    var isChatActive = chat.id === ctx.currentSessionId;
    var isMenuOpen = Boolean(ctx.ellipsisOpen && ctx.ellipsisOpen.id === "chat::" + chat.id);
    var subagents = ctx.grouping.getSubagents(chat.id);
    var hasSubagents = subagents.length > 0;
    var isSubExp = Boolean(ctx.expandedSubagents[chat.id]);
    var isPinned = ctx.grouping.isPinnedSession(chat, chat.id);
    var isRunning = ctx.grouping.isRunningSession(chat);

    /** Opens the context menu at a click position or at the ellipsis button. */
    function openMenu(pos) {
      ctx.setEllipsisOpen({ id: "chat::" + chat.id, pos: pos });
    }
    var chatOpenHandlers = chatRowOpenHandlers(ctx, chat, openMenu);

    return h(
      "div",
      {
        key: "chat-wrapper::" + chat.id,
        style: { display: "flex", flexDirection: "column", width: "100%" },
      },
      h(
        "div",
        {
          key: "chat::" + chat.id,
          className:
            "dsh-tree-sessionRow" +
            (hasSubagents ? " dsh-has-children" : "") +
            (isChatActive ? " dsh-tree-sessionRowActive" : ""),
          role: "treeitem",
          "data-session-id": chat.id,
          "aria-expanded": hasSubagents ? isSubExp : undefined,
          style: {
            paddingLeft: padLeft + "px",
            height: "30px",
            color: isChatActive ? "var(--dsw-alias-primary, #6366f1)" : "inherit",
            fontWeight: isChatActive ? 600 : 400,
            cursor: "pointer",
            position: "relative",
          },
          onClick: chatOpenHandlers.onClick,
          onContextMenu: chatOpenHandlers.onContextMenu,
        },
        h(
          "span",
          {
            className: "dsh-tree-slot dsh-tree-icon",
            style: isPinned ? { color: "var(--dsw-alias-primary, #6366f1)" } : undefined,
          },
          h(isPinned ? glyphs.Pin : glyphs.Chat, { size: isPinned ? 13 : 14 }),
        ),
        hasSubagents
          ? h(
              "span",
              {
                className: "dsh-tree-slot dsh-tree-chevron",
                title: isSubExp ? "Collapse subagents" : "Expand subagents",
                onClick: function (event) {
                  event.preventDefault();
                  event.stopPropagation();
                  ctx.toggleSubagentExpand(chat.id);
                },
              },
              h(glyphs.TriangleRight, {
                className: "dsh-tree-arrow" + (isSubExp ? " dsh-tree-arrowOpen" : ""),
                size: 11,
              }),
            )
          : null,
        h(
          "span",
          { className: "dsh-tree-title", title: chat.title || "Chat Session" },
          chat.title || "Untitled Chat",
        ),
        hasSubagents
          ? h(
              "span",
              {
                style: {
                  padding: "1px 5px",
                  borderRadius: "8px",
                  fontSize: "9.5px",
                  background: "rgba(99, 102, 241, 0.15)",
                  color: "var(--dsw-alias-primary, #6366f1)",
                  fontWeight: 700,
                  marginLeft: "4px",
                  cursor: "pointer",
                },
                title: subagents.length + " subagents (click to toggle)",
                onClick: function (event) {
                  event.preventDefault();
                  event.stopPropagation();
                  ctx.toggleSubagentExpand(chat.id);
                },
              },
              subagents.length,
            )
          : null,
        h(
          "span",
          {
            style: {
              display: "flex",
              alignItems: "center",
              marginLeft: "auto",
              marginRight: "4px",
              flexShrink: 0,
            },
          },
          isRunning ? renderRunningDot() : null,
          h(
            "span",
            { style: { fontSize: "10.5px", color: "var(--dsw-alias-label-tertiary)" } },
            formatTimeAgo(chat.updatedAt),
          ),
        ),
        h(
          "span",
          { className: "dsh-tree-actions" },
          renderRowActionsMenu(
            Object.assign(
              { title: "Chat Actions (…)" },
              ellipsisTriggerProps(ctx, isMenuOpen, openMenu),
              {
                items: [
                  {
                    id: isPinned ? "unpin" : "pin",
                    label: isPinned ? "Unpin Chat" : "Pin Chat",
                    icon: h(glyphs.Pin, { size: 13 }),
                  },
                  { id: "rename", label: "Rename Chat", icon: h(glyphs.Edit, { size: 13 }) },
                  { id: "fork", label: "Fork Chat", icon: h(glyphs.Branch, { size: 13 }) },
                  {
                    id: "archive",
                    label: "Archive Chat",
                    icon: h(glyphs.Trash, { size: 13 }),
                    danger: true,
                  },
                ],
                onSelect: function (actionId) {
                  if (actionId === "pin" || actionId === "unpin") {
                    ctx.grouping.togglePinSession(chat.id);
                  } else if (actionId === "rename") {
                    var newTitle = prompt("Rename chat:", chat.title || "");
                    if (newTitle) ctx.dispatch.rename(chat.id, newTitle);
                  } else if (actionId === "fork") {
                    ctx.dispatch.fork(chat.id);
                  } else if (actionId === "archive") {
                    ctx.onArchiveChat(chat.id);
                  }
                },
              },
            ),
          ),
        ),
      ),
      hasSubagents && isSubExp
        ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            subagents.map(function (sub) {
              return renderSubagentRow(sub, padLeft, ctx);
            }),
          )
        : null,
    );
  }

  /**
   * Renders one subagent row nested under its parent chat.
   * @param sub - the subagent session record.
   * @param parentPadLeft - the parent chat row's indent.
   * @param ctx - see `renderChatRow`.
   * @returns the row element.
   */
  function renderSubagentRow(sub, parentPadLeft, ctx) {
    var isSubActive = sub.id === ctx.currentSessionId;
    var isSubMenuOpen = Boolean(ctx.ellipsisOpen && ctx.ellipsisOpen.id === "chat::" + sub.id);

    /** Opens the subagent's context menu at a click position or at the ellipsis button. */
    function openMenu(pos) {
      ctx.setEllipsisOpen({ id: "chat::" + sub.id, pos: pos });
    }
    var chatOpenHandlers = chatRowOpenHandlers(ctx, sub, openMenu);

    return h(
      "div",
      {
        key: "sub::" + sub.id,
        className:
          "dsh-tree-sessionRow dsh-tree-subagentRow" +
          (isSubActive ? " dsh-tree-sessionRowActive" : ""),
        role: "treeitem",
        "data-session-id": sub.id,
        style: {
          paddingLeft: parentPadLeft + 16 + "px",
          height: "28px",
          color: isSubActive ? "var(--dsw-alias-primary, #6366f1)" : "inherit",
          cursor: "pointer",
        },
        onClick: chatOpenHandlers.onClick,
        onContextMenu: chatOpenHandlers.onContextMenu,
      },
      h("span", { className: "dsh-tree-slot dsh-tree-icon" }, h(glyphs.Subagent, { size: 12 })),
      h(
        "span",
        {
          className: "dsh-tree-title",
          style: { fontSize: "11.5px" },
          title: sub.title || "Subagent Session",
        },
        sub.title || "Subagent",
      ),
      h(
        "span",
        {
          style: {
            fontSize: "10px",
            color: "var(--dsw-alias-label-tertiary)",
            marginLeft: "auto",
            marginRight: "4px",
            flexShrink: 0,
          },
        },
        formatTimeAgo(sub.updatedAt),
      ),
      h(
        "span",
        { className: "dsh-tree-actions" },
        renderRowActionsMenu(
          Object.assign(
            { title: "Subagent Actions", iconSize: 12 },
            ellipsisTriggerProps(ctx, isSubMenuOpen, openMenu),
            {
              items: [
                { id: "rename", label: "Rename Subagent", icon: h(glyphs.Edit, { size: 13 }) },
                {
                  id: "archive",
                  label: "Archive Subagent",
                  icon: h(glyphs.Trash, { size: 13 }),
                  danger: true,
                },
              ],
              onSelect: function (actionId) {
                if (actionId === "rename") {
                  var newTitle = prompt("Rename subagent:", sub.title || "");
                  if (newTitle) ctx.dispatch.rename(sub.id, newTitle);
                } else if (actionId === "archive") {
                  ctx.onArchiveChat(sub.id);
                }
              },
            },
          ),
        ),
      ),
    );
  }

  /**
   * Renders one archived chat row, its quick-restore button and its
   * restore/rename/delete menu.
   * @param chat - the archived session record.
   * @param padLeft - the row's indent in pixels.
   * @param ctx - `{ currentSessionId, ellipsisOpen, setEllipsisOpen,
   * dispatch, grouping, quotasApiBase, loadAll, onOpenChat, onActionFailure }`.
   * @returns the row element.
   */
  function renderArchivedChatRow(chat, padLeft, ctx) {
    var isChatActive = chat.id === ctx.currentSessionId;
    var isMenuOpen = Boolean(
      ctx.ellipsisOpen && ctx.ellipsisOpen.id === "archived-chat::" + chat.id,
    );

    /** Opens the archived row's context menu at a click position or at the ellipsis button. */
    function openMenu(pos) {
      ctx.setEllipsisOpen({ id: "archived-chat::" + chat.id, pos: pos });
    }
    var chatOpenHandlers = chatRowOpenHandlers(ctx, chat, openMenu);

    /** Restores the chat, surfacing a failure instead of leaving the click looking inert. */
    function restore() {
      ctx.grouping
        .unarchiveSession(chat.id, ctx.quotasApiBase)
        .catch(function (error) {
          ctx.onActionFailure({
            action: "Restore",
            message: (error && error.message) || "Restore failed.",
          });
        })
        .then(ctx.loadAll);
    }

    return h(
      "div",
      {
        key: "archived-chat::" + chat.id,
        className: "dsh-tree-sessionRow" + (isChatActive ? " dsh-tree-sessionRowActive" : ""),
        role: "treeitem",
        "data-session-id": chat.id,
        style: {
          paddingLeft: padLeft + "px",
          height: "28px",
          opacity: 0.75,
          cursor: "pointer",
          position: "relative",
        },
        onClick: chatOpenHandlers.onClick,
        onContextMenu: chatOpenHandlers.onContextMenu,
      },
      h(
        "span",
        {
          className: "dsh-tree-slot dsh-tree-icon",
          style: { color: "var(--dsw-alias-label-tertiary)" },
        },
        h(glyphs.Chat, { size: 14 }),
      ),
      h(
        "span",
        { className: "dsh-tree-title", title: chat.title || "Archived Chat" },
        chat.title || "Untitled Chat",
      ),
      h(
        "span",
        {
          style: {
            fontSize: "10px",
            color: "var(--dsw-alias-label-tertiary)",
            marginLeft: "auto",
            marginRight: "4px",
            flexShrink: 0,
          },
        },
        formatTimeAgo(chat.updatedAt),
      ),
      h(
        "span",
        { className: "dsh-tree-actions" },
        h(
          "button",
          {
            type: "button",
            className: "dsh-tree-actionBtn",
            title: "Restore / Unarchive",
            onClick: function (event) {
              event.stopPropagation();
              restore();
            },
          },
          h(glyphs.Restore, { size: 13 }),
        ),
        renderRowActionsMenu(
          Object.assign(
            { title: "Archived Actions (…)" },
            ellipsisTriggerProps(ctx, isMenuOpen, openMenu),
            {
              items: [
                {
                  id: "restore",
                  label: "Restore to Active",
                  icon: h(glyphs.Restore, { size: 13 }),
                },
                { id: "rename", label: "Rename Chat", icon: h(glyphs.Edit, { size: 13 }) },
                {
                  id: "delete",
                  label: "Delete Permanently",
                  icon: h(glyphs.Trash, { size: 13 }),
                  danger: true,
                },
              ],
              onSelect: function (actionId) {
                if (actionId === "restore") {
                  restore();
                } else if (actionId === "rename") {
                  var newTitle = prompt("Rename chat:", chat.title || "");
                  if (newTitle) ctx.dispatch.rename(chat.id, newTitle);
                } else if (actionId === "delete") {
                  if (!confirm("Permanently delete this archived session?")) return;
                  ctx.grouping
                    .deletePermanentSession(chat.id, ctx.quotasApiBase)
                    .catch(function (error) {
                      ctx.onActionFailure({
                        action: "Delete",
                        message: (error && error.message) || "Delete failed.",
                      });
                    })
                    .then(ctx.loadAll);
                }
              },
            },
          ),
        ),
      ),
    );
  }

  return { renderChatRow: renderChatRow, renderArchivedChatRow: renderArchivedChatRow };
}
