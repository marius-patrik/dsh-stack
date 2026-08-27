/**
 * The one tab strip. The main area, the bottom panel and the secondary sidebar
 * all render this component; only the placement they pass in differs. It owns
 * the tab chips, their icons, the close affordance, drag-out, the per-tab
 * context menu trigger and the trailing end-aligned new-tab button (issue
 * #124), so none of those can drift per surface.
 *
 * @module @dsh-stack/workspace-tabs/create-tab-strip
 */
import type { TabSurfacePlacement } from "./tab-surface-placement.js";
import type {
  TabComponent,
  TabElement,
  TabSurfaceChrome,
  TabSurfaceReact,
} from "./tab-surface-runtime.js";
import type { WorkspaceTab } from "./workspace-tab.js";

/** The MIME-ish key a dragged tab travels under between surfaces. */
export const TAB_DRAG_TYPE = "text/dsh-tab";

/** Everything the strip renders from. */
export interface TabStripProps {
  readonly placement: TabSurfacePlacement;
  readonly tabs: readonly WorkspaceTab[];
  readonly activeTabId: string | null;
  onActivate(tabId: string): void;
  onClose(tabId: string): void;
  onContextMenu(tab: WorkspaceTab, position: { x: number; y: number }): void;
  onNewTab(anchor: { current: unknown }): void;
}

const CHIP_BASE: Record<string, string | number> = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  padding: "3px 8px",
  borderRadius: "5px",
  fontSize: "12px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  maxWidth: "200px",
  transition: "all 120ms ease",
};

const ICON_BUTTON: Record<string, string | number> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "16px",
  height: "16px",
  border: "none",
  borderRadius: "3px",
  background: "transparent",
  color: "inherit",
  opacity: 0.6,
  cursor: "pointer",
  fontSize: "12px",
  padding: 0,
};

/** Selection colouring for one chip. */
function chipStyle(selected: boolean): Record<string, string | number> {
  return {
    ...CHIP_BASE,
    background: selected
      ? "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.18))"
      : "transparent",
    border: selected ? "1px solid var(--dsw-alias-primary, #6366f1)" : "1px solid transparent",
    color: selected
      ? "var(--dsw-alias-label-primary, #fff)"
      : "var(--dsw-alias-label-secondary, #8b949e)",
    fontWeight: selected ? 600 : 400,
  };
}

/** Builds the shared tab strip component over the host's React and chrome. */
export function createTabStrip(react: TabSurfaceReact, chrome: TabSurfaceChrome): TabComponent {
  const h = react.createElement;

  /** Renders the strip for one surface. */
  return function TabStrip(props: TabStripProps): TabElement {
    const newTabRef = react.useRef<unknown>(null);

    const chips = props.tabs.map((tab) =>
      h(
        "div",
        {
          key: tab.id,
          role: "tab",
          draggable: true,
          "aria-selected": tab.id === props.activeTabId,
          "data-tab-id": tab.id,
          style: chipStyle(tab.id === props.activeTabId),
          onClick: () => props.onActivate(tab.id),
          onDragStart: (event: { dataTransfer: { setData(type: string, data: string): void } }) => {
            event.dataTransfer.setData(TAB_DRAG_TYPE, JSON.stringify(tab));
          },
          onContextMenu: (event: {
            preventDefault(): void;
            stopPropagation(): void;
            clientX: number;
            clientY: number;
          }) => {
            event.preventDefault();
            event.stopPropagation();
            props.onContextMenu(tab, { x: event.clientX, y: event.clientY });
          },
        },
        chrome.tabGlyph(tab.kind, 12),
        h(
          "span",
          { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } },
          tab.title,
        ),
        tab.closable === false
          ? null
          : h(
              "button",
              {
                type: "button",
                title: "Close Tab",
                style: ICON_BUTTON,
                onClick: (event: { stopPropagation(): void }) => {
                  event.stopPropagation();
                  props.onClose(tab.id);
                },
              },
              "×",
            ),
      ),
    );

    const newTabButton = h(
      "button",
      {
        key: "new-tab",
        ref: newTabRef,
        type: "button",
        title: `New Tab in ${props.placement.label}`,
        "aria-label": `New Tab in ${props.placement.label}`,
        style: { ...ICON_BUTTON, width: "22px", height: "22px", opacity: 1, marginLeft: "2px" },
        onClick: (event: { stopPropagation(): void }) => {
          event.stopPropagation();
          props.onNewTab(newTabRef);
        },
      },
      chrome.menuGlyph("plus", 13),
    );

    return h(
      "div",
      {
        className: "dsh-tab-strip",
        "data-surface": props.placement.id,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          minWidth: 0,
          flex: "1 1 auto",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        },
      },
      ...chips,
      newTabButton,
    );
  };
}
