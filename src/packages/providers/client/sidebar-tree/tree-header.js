/**
 * The sidebar tree's header strip: the section title, the collapsible search
 * field, the view-options menu and the New Item button.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/tree-header
 */

/**
 * Build the header renderer for one render pass.
 * @param runtime - the sidebar tree runtime (`h`, `SelectDropdownMenu`, glyphs).
 * @param parts - `{ newItemMenu }`.
 * @param controller - the tree controller for this render pass.
 * @returns `renderTreeHeader()`.
 */
function __dshCreateTreeHeader(runtime, parts, controller) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;

  /**
   * A square icon button in the header strip.
   * @param spec - `{ key, title, icon, onClick, buttonRef }`.
   * @returns the button element.
   */
  function headerButton(spec) {
    return h(
      "button",
      {
        key: spec.key,
        ref: spec.buttonRef,
        type: "button",
        className: "dsh-tree-actionBtn",
        title: spec.title,
        "aria-label": spec.title,
        style: {
          width: "26px",
          height: "26px",
          borderRadius: "5px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        },
        onClick: spec.onClick,
      },
      spec.icon,
    );
  }

  /**
   * The expanded search field.
   * @returns the search field element.
   */
  function renderSearchField() {
    return h(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          flex: 1,
          gap: "6px",
          background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.06))",
          padding: "2px 8px",
          borderRadius: "6px",
          border: "1px solid var(--dsw-alias-primary, #6366f1)",
        },
      },
      h(glyphs.search, { size: 13, style: { color: "var(--dsw-alias-label-secondary)" } }),
      h("input", {
        ref: controller.searchInputRef,
        type: "text",
        placeholder: "Search chats, files…",
        value: controller.searchQuery,
        onChange: function (event) {
          controller.setSearchQuery(event.target.value);
        },
        onKeyDown: function (event) {
          if (event.key === "Escape") controller.closeSearch();
        },
        style: {
          background: "transparent",
          border: "none",
          outline: "none",
          color: "var(--dsw-alias-label-primary)",
          fontSize: "12px",
          width: "100%",
        },
      }),
      h(
        "button",
        {
          type: "button",
          "aria-label": "Close search",
          onClick: controller.closeSearch,
          style: {
            background: "transparent",
            border: "none",
            color: "var(--dsw-alias-label-tertiary)",
            cursor: "pointer",
            fontSize: "12px",
            padding: 0,
          },
        },
        "✕",
      ),
    );
  }

  /**
   * The header's trailing button cluster.
   * @returns the cluster element.
   */
  function renderHeaderActions() {
    return h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "2px" } },
      controller.showSearchButton
        ? headerButton({
            key: "search",
            title: "Search workspaces & chats",
            icon: h(glyphs.search, { size: 14 }),
            onClick: controller.openSearch,
          })
        : null,
      headerButton({
        key: "view-options",
        title: "View Options",
        icon: h(glyphs.sliders, { size: 14 }),
        buttonRef: controller.viewOptionsButtonRef,
        onClick: function () {
          controller.setViewOptionsOpen(!controller.viewOptionsOpen);
        },
      }),
      controller.viewOptionsOpen
        ? h(runtime.SelectDropdownMenu, {
            key: "view-options-menu",
            open: true,
            anchorRef: controller.viewOptionsButtonRef,
            onClose: function () {
              controller.setViewOptionsOpen(false);
            },
            items: [
              {
                id: "archive-empty",
                label: "Archive Empty & Pong Sessions",
                icon: h(glyphs.trash, { size: 13 }),
                danger: true,
              },
            ],
            onSelect: function (actionId) {
              controller.setViewOptionsOpen(false);
              if (actionId === "archive-empty") controller.archiveEmptyChats();
            },
          })
        : null,
      parts.newItemMenu.renderButton(controller.defaultDirectory, "root-ws"),
    );
  }

  /**
   * Render the header strip.
   * @returns the header element.
   */
  function renderTreeHeader() {
    return h(
      "div",
      {
        key: "tree-header",
        className: "dsh-sidebar-section-header",
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 8px 8px 10px",
          minHeight: "36px",
          flex: "0 0 auto",
          borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))",
          userSelect: "none",
        },
      },
      controller.searchExpanded
        ? renderSearchField()
        : h(
            "span",
            {
              style: {
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--dsw-alias-label-secondary)",
              },
            },
            "Workspaces",
          ),
      controller.searchExpanded ? null : renderHeaderActions(),
    );
  }

  return renderTreeHeader;
}
