/**
 * The sidebar tree at rail width: search, New Item, a live-process indicator
 * and a way back to the expanded workspaces explorer.
 *
 * The rail carried its own shorter copy of the New Item menu, so the two
 * drifted apart; it now opens the same menu the tree does, anchored to the
 * rail button.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/collapsed-rail
 */

/**
 * Build the collapsed-rail renderer for one render pass.
 * @param runtime - the sidebar tree runtime (`h`, `SelectDropdownMenu`, glyphs).
 * @param parts - `{ newItemMenu }`.
 * @param controller - the tree controller for this render pass.
 * @returns `renderCollapsedRail()`.
 */
function __dshCreateCollapsedRail(runtime, parts, controller) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;

  var RAIL_BUTTON_STYLE = {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--dsw-alias-label-primary, #ffffff)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "background 120ms ease",
  };

  /**
   * One rail button.
   * @param spec - `{ key, title, icon, onClick, buttonRef, extraStyle, badge }`.
   * @returns the button element.
   */
  function railButton(spec) {
    return h(
      "button",
      {
        key: spec.key,
        ref: spec.buttonRef,
        type: "button",
        className: "dsh-tree-actionBtn dsh-rail-btn",
        title: spec.title,
        "aria-label": spec.ariaLabel || spec.title,
        style: Object.assign({}, RAIL_BUTTON_STYLE, spec.extraStyle),
        onClick: spec.onClick,
      },
      spec.icon,
      spec.badge || null,
    );
  }

  /**
   * The dot marking that something is running while the sidebar is collapsed.
   * @returns the dot element.
   */
  function renderRailLiveDot() {
    return h("span", {
      key: "live",
      style: {
        position: "absolute",
        top: "6px",
        right: "6px",
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: "#3fb950",
        boxShadow: "0 0 4px #3fb950",
      },
    });
  }

  /**
   * Render the rail.
   * @returns the rail element.
   */
  function renderCollapsedRail() {
    var plusMenu = controller.plusMenu;
    var isPlusOpen = Boolean(plusMenu && (plusMenu === "rail" || plusMenu.key === "rail"));
    var liveCount = controller.grouping.terminals.length + controller.grouping.containers.length;

    return h(
      "div",
      {
        className: "dsh-collapsed-rail",
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "6px",
          width: "100%",
          height: "100%",
          paddingTop: "4px",
          position: "relative",
        },
      },
      controller.showSearchButton
        ? railButton({
            key: "search",
            title: "Search workspaces & chats",
            ariaLabel: "Search",
            icon: h(glyphs.search, { size: 16, className: "dsh-icon-search dsh-icon-animated" }),
            onClick: controller.expandAndSearch,
          })
        : null,
      h(
        "div",
        { key: "new-item", style: { position: "relative" } },
        railButton({
          key: "plus",
          title: "New Item (+)",
          ariaLabel: "New Item",
          buttonRef: controller.railPlusButtonRef,
          icon: h(glyphs.plus, { size: 16, className: "dsh-icon-plus dsh-icon-animated" }),
          onClick: function (event) {
            event.stopPropagation();
            var rect = event.currentTarget.getBoundingClientRect();
            var swapped =
              typeof document !== "undefined" &&
              document.body.classList.contains("dsh-sidebars-swapped");
            controller.setPlusMenu(
              isPlusOpen
                ? null
                : {
                    key: "rail",
                    pos: {
                      x: Math.max(8, swapped ? rect.left - 194 : rect.right + 4),
                      y: Math.max(8, rect.top),
                    },
                  },
            );
          },
        }),
        isPlusOpen
          ? h(runtime.SelectDropdownMenu, {
              open: true,
              position: plusMenu && plusMenu.pos ? plusMenu.pos : null,
              anchorRef: controller.railPlusButtonRef,
              onClose: function () {
                controller.setPlusMenu(null);
              },
              items: parts.newItemMenu.items,
              onSelect: function (actionId) {
                parts.newItemMenu.select(actionId, controller.defaultDirectory);
              },
            })
          : null,
      ),
      railButton({
        key: "processes",
        title: liveCount > 0 ? "Active processes (" + liveCount + ")" : "Terminals & Sandboxes",
        ariaLabel: "Terminals & Sandboxes",
        extraStyle: { position: "relative" },
        icon: h(glyphs.terminals, { size: 16, className: "dsh-icon-terminal dsh-icon-animated" }),
        badge: liveCount > 0 ? renderRailLiveDot() : null,
        onClick: controller.openFirstTerminal,
      }),
      railButton({
        key: "explorer",
        title: "Workspaces Explorer",
        icon: h(glyphs.blueFolder, { size: 16, className: "dsh-icon-folder dsh-icon-animated" }),
        onClick: controller.expandSidebar,
      }),
    );
  }

  return renderCollapsedRail;
}
