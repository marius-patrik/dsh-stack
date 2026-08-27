/**
 * The shared empty state. Every surface with no tabs shows this same picker,
 * offering exactly the tab kinds the content registry can create, so the three
 * surfaces cannot disagree about what "new tab" means.
 *
 * @module @dsh-stack/workspace-tabs/create-empty-surface-picker
 */
import type { TabContentRegistry, TabContentType } from "./create-tab-content-registry.js";
import type { TabSurfacePlacement } from "./tab-surface-placement.js";
import type {
  TabComponent,
  TabElement,
  TabSurfaceChrome,
  TabSurfaceReact,
} from "./tab-surface-runtime.js";

/** What the empty state renders from. */
export interface EmptySurfacePickerProps {
  readonly placement: TabSurfacePlacement;
  readonly registry: TabContentRegistry;
  onCreate(type: TabContentType): void;
}

/** Builds the shared empty-surface picker over the host's React and chrome. */
export function createEmptySurfacePicker(
  react: TabSurfaceReact,
  chrome: TabSurfaceChrome,
): TabComponent {
  const h = react.createElement;

  /** Renders the "nothing open here yet" state for one surface. */
  return function EmptySurfacePicker(props: EmptySurfacePickerProps): TabElement {
    const buttons = props.registry.creatable().map((type) =>
      h(
        "button",
        {
          key: type.kind,
          type: "button",
          style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            borderRadius: "8px",
            border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
            background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.04))",
            color: "inherit",
            fontSize: "12.5px",
            fontWeight: 500,
            cursor: "pointer",
          },
          onClick: () => props.onCreate(type),
        },
        chrome.tabGlyph(type.kind, 14),
        `New ${type.label}`,
      ),
    );

    return h(
      "div",
      {
        className: "dsh-tab-surface-empty",
        style: {
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "32px",
          color: "var(--dsw-alias-label-primary, #fff)",
          fontFamily: "var(--ds-font-family, sans-serif)",
        },
      },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } },
        h(
          "div",
          { style: { fontSize: "16px", fontWeight: 600 } },
          `Nothing open in the ${props.placement.label}`,
        ),
        h(
          "div",
          { style: { fontSize: "12.5px", color: "var(--dsw-alias-label-secondary, #888)" } },
          "Open a new tab, or drag a tab here from another area.",
        ),
      ),
      h(
        "div",
        { style: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" } },
        ...buttons,
      ),
    );
  };
}
