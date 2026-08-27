/**
 * The single row primitive every sidebar tree node renders through: group
 * headers, chat rows, subagent rows, archived rows, live terminal and
 * container rows, directory rows and file rows.
 *
 * Before the sidebar tree was extracted out of the providers client monolith
 * each of those rows was its own hand-assembled block of `h("div", ...)` with
 * its own copy of the icon slot, chevron slot, title span, count badge and
 * action tray. Describing a row instead of rebuilding one is what lets the
 * groups, rows and menus live in separate files without any of them repeating
 * the row markup.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/tree-row
 */

/**
 * Build the row renderer bound to one providers client runtime.
 * @param runtime - the sidebar tree runtime (`h`, glyph set, formatters).
 * @returns `renderTreeRow(spec)`.
 */
function __dshCreateTreeRow(runtime) {
  var h = runtime.h;
  var Chevron = runtime.glyphs.chevron;

  var BADGE_TONES = {
    accent: { background: "rgba(99, 102, 241, 0.15)", color: "var(--dsw-alias-primary, #6366f1)" },
    muted: { background: "rgba(128,128,128,0.15)", color: "var(--dsw-alias-label-secondary)" },
    live: { background: "rgba(63, 185, 80, 0.18)", color: "#3fb950" },
  };

  /**
   * The pill carrying a row's count.
   * @param badge - `{ text, tone }`; tone defaults to `accent`.
   * @returns the badge element, or null when there is nothing to count.
   */
  function renderBadge(badge) {
    if (!badge || badge.text === null || badge.text === undefined) return null;
    var tone = BADGE_TONES[badge.tone] || BADGE_TONES.accent;
    return h(
      "span",
      {
        key: "badge",
        onClick: badge.onClick,
        title: badge.title,
        style: {
          padding: "1px 5px",
          borderRadius: "8px",
          fontSize: "9.5px",
          background: tone.background,
          color: tone.color,
          fontWeight: 700,
          marginLeft: "4px",
          cursor: badge.onClick ? "pointer" : "inherit",
        },
      },
      badge.text,
    );
  }

  /**
   * The green "this is running" dot pinned to a row's trailing edge.
   * @returns the dot element.
   */
  function renderLiveDot() {
    return h("span", {
      key: "live",
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

  /**
   * The right-aligned relative timestamp.
   * @param meta - already formatted text.
   * @param compact - true for the smaller subagent and archived variants.
   * @returns the timestamp element, or null when there is no timestamp.
   */
  function renderMeta(meta, compact) {
    if (!meta) return null;
    return h(
      "span",
      {
        key: "meta",
        style: {
          fontSize: compact ? "10px" : "10.5px",
          color: "var(--dsw-alias-label-tertiary)",
          marginLeft: "auto",
          marginRight: "4px",
          flexShrink: 0,
        },
      },
      meta,
    );
  }

  /**
   * The disclosure triangle. A chevron with its own `onClick` swallows the
   * event so expanding a node never also opens it.
   * @param chevron - `{ open, onClick, title }`, or null for a leaf row.
   * @returns the chevron slot, or null.
   */
  function renderChevron(chevron) {
    if (!chevron) return null;
    return h(
      "span",
      {
        key: "chevron",
        className: "dsh-tree-slot dsh-tree-chevron",
        title: chevron.title,
        onClick: chevron.onClick
          ? function (event) {
              event.preventDefault();
              event.stopPropagation();
              chevron.onClick();
            }
          : undefined,
      },
      h(Chevron, {
        className: "dsh-tree-arrow" + (chevron.open ? " dsh-tree-arrowOpen" : ""),
        size: 11,
      }),
    );
  }

  /**
   * Render one sidebar tree row from its description.
   * @param spec - row description; see the module comment for the vocabulary.
   * @returns the row element.
   */
  function renderTreeRow(spec) {
    return h(
      "div",
      {
        key: spec.key,
        className: spec.className,
        role: "treeitem",
        "data-session-id": spec.sessionId,
        "aria-expanded": spec.ariaExpanded,
        title: spec.rowTitle,
        style: Object.assign(
          {
            position: "relative",
            paddingLeft: (spec.padLeft || 0) + "px",
            height: (spec.height || 28) + "px",
            cursor: spec.onClick ? "pointer" : "default",
          },
          spec.style,
        ),
        onClick: spec.onClick,
        onDoubleClick: spec.onDoubleClick,
        onContextMenu: spec.onContextMenu,
      },
      spec.icon
        ? h(
            "span",
            { key: "icon", className: "dsh-tree-slot dsh-tree-icon", style: spec.iconStyle },
            spec.icon,
          )
        : null,
      renderChevron(spec.chevron),
      h(
        "span",
        {
          key: "title",
          className: "dsh-tree-title",
          style: spec.titleStyle,
          title: spec.titleHint,
        },
        spec.title,
      ),
      renderBadge(spec.badge),
      renderMeta(spec.meta, spec.compactMeta),
      spec.liveDot ? renderLiveDot() : null,
      spec.actions
        ? h("span", { key: "actions", className: "dsh-tree-actions" }, spec.actions)
        : null,
    );
  }

  return renderTreeRow;
}
