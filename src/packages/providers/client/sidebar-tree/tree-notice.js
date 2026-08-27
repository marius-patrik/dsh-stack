/**
 * The banner the sidebar tree shows when a row action could not be carried
 * out, or when one finished with something to report.
 *
 * This is the visible half of issue #98: `session-action-dispatch` refuses to
 * resolve an action that did not happen, and this is where the user finds out.
 * It sits at the top of the tree, names the reason, and stays until dismissed
 * -- a dialog would interrupt, and a console line would be indistinguishable
 * from the silence being fixed.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/tree-notice
 */

/**
 * Build the notice renderer bound to one providers client runtime.
 * @param runtime - the sidebar tree runtime (`h`).
 * @returns `renderTreeNotice(notice, onDismiss)`.
 */
function __dshCreateTreeNotice(runtime) {
  var h = runtime.h;

  var TONES = {
    error: { border: "rgba(248, 81, 73, 0.45)", background: "rgba(248, 81, 73, 0.12)" },
    info: { border: "rgba(99, 102, 241, 0.45)", background: "rgba(99, 102, 241, 0.12)" },
  };

  /**
   * Render the notice.
   * @param notice - `{ tone, message }`, or null when there is nothing to say.
   * @param onDismiss - clears the notice.
   * @returns the banner element, or null.
   */
  function renderTreeNotice(notice, onDismiss) {
    if (!notice) return null;
    var tone = TONES[notice.tone] || TONES.error;
    return h(
      "div",
      {
        key: "tree-notice",
        role: notice.tone === "info" ? "status" : "alert",
        style: {
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          margin: "6px 8px",
          padding: "8px 10px",
          borderRadius: "6px",
          border: "1px solid " + tone.border,
          background: tone.background,
          color: "var(--dsw-alias-label-primary, #ffffff)",
          fontSize: "11.5px",
          lineHeight: 1.4,
        },
      },
      h("span", { style: { flex: 1, minWidth: 0, wordBreak: "break-word" } }, notice.message),
      h(
        "button",
        {
          type: "button",
          "aria-label": "Dismiss",
          title: "Dismiss",
          onClick: onDismiss,
          style: {
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            fontSize: "12px",
            lineHeight: 1,
            padding: 0,
          },
        },
        "✕",
      ),
    );
  }

  return renderTreeNotice;
}
