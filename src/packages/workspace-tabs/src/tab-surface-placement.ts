/**
 * The only things that are allowed to differ between workspace surfaces:
 * where the surface is anchored, how it is sized, whether it docks and whether
 * it collapses. Everything else -- the tab strip, the overflow behaviour, the
 * new-tab button, the context menu, the move semantics and the empty state --
 * is shared, so it must not appear here.
 *
 * @module @dsh-stack/workspace-tabs/tab-surface-placement
 */
import type { WorkspaceSurfaceId } from "./workspace-tab.js";

/** CSS declarations for one absolutely positioned surface box. */
export type SurfaceBoxStyle = Record<string, string | number>;

/**
 * Where the host shell leaves room for a surface. `left`/`right`/`top` are
 * pixel insets measured from the viewport edges; `bottomInset` is a CSS length
 * because the bottom panel reports its own height as `84vh` when maximised.
 */
export interface SurfaceBounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottomInset: string;
}

/** How a surface is drawn, sized, docked and collapsed. */
export interface TabSurfacePlacement {
  readonly id: WorkspaceSurfaceId;
  /** Human label used in move menus and the empty state ("Bottom Panel"). */
  readonly label: string;
  /** Height of the tab strip in pixels. */
  readonly stripHeight: number;
  /** Stacking order against the harness shell. */
  readonly zIndex: number;
  /** Whether the surface offers a collapse/expand toggle. */
  readonly collapsible: boolean;
  /** Which dimension the drag handle resizes, if any. */
  readonly resizeAxis: "none" | "height" | "width";
  readonly defaultSize: number;
  readonly minSize: number;
  /** Upper size bound, evaluated against the live viewport. */
  maxSize(viewport: { readonly width: number; readonly height: number }): number;
  /** Size change for a pointer drag, given the drag origin and swapped sidebars. */
  resizeDelta(
    origin: { x: number; y: number },
    point: { x: number; y: number },
    swapped: boolean,
  ): number;
  /** The surface's outer box, given the shell bounds and current geometry. */
  boxStyle(
    bounds: SurfaceBounds,
    size: number,
    collapsed: boolean,
    hasBody: boolean,
  ): SurfaceBoxStyle;
  /** The drag handle's box, or null when the surface does not resize. */
  handleStyle(): SurfaceBoxStyle | null;
}

const COLLAPSED_STRIP = 38;

/** Shared frame every surface box starts from: a fixed, column-stacked panel. */
function fixedBox(extra: SurfaceBoxStyle): SurfaceBoxStyle {
  return { position: "fixed", display: "flex", flexDirection: "column", ...extra };
}

/** The main area: pinned under the shell header, collapses to nothing, never resizes. */
const MAIN: TabSurfacePlacement = {
  id: "main",
  label: "Main Area",
  stripHeight: 36,
  zIndex: 50,
  collapsible: false,
  resizeAxis: "none",
  defaultSize: 0,
  minSize: 0,
  maxSize: () => 0,
  resizeDelta: () => 0,
  /** The main area fills the shell centre, or just its strip when idle. */
  boxStyle(bounds, _size, _collapsed, hasBody) {
    return fixedBox({
      top: `${bounds.top}px`,
      left: `${bounds.left}px`,
      right: `${bounds.right}px`,
      bottom: hasBody ? bounds.bottomInset : "auto",
      height: hasBody ? "auto" : `${MAIN.stripHeight}px`,
      zIndex: MAIN.zIndex,
    });
  },
  handleStyle: () => null,
};

/** The bottom panel: docked to the shell floor, height-resizable, collapsible. */
const BOTTOM: TabSurfacePlacement = {
  id: "bottom",
  label: "Bottom Panel",
  stripHeight: 38,
  zIndex: 9000,
  collapsible: true,
  resizeAxis: "height",
  defaultSize: 290,
  minSize: 160,
  maxSize: (viewport) => Math.round(viewport.height * 0.88),
  resizeDelta: (origin, point) => origin.y - point.y,
  /** The bottom panel spans the shell centre and grows upward from the floor. */
  boxStyle(bounds, size, collapsed) {
    return fixedBox({
      bottom: 0,
      left: `${bounds.left}px`,
      right: `${bounds.right}px`,
      height: collapsed ? `${COLLAPSED_STRIP}px` : `${size}px`,
      zIndex: BOTTOM.zIndex,
      boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.4)",
    });
  },
  handleStyle: () => ({ top: "-4px", left: 0, right: 0, height: "8px", cursor: "row-resize" }),
};

/** The secondary sidebar: a full-height right column, width-resizable, collapsible. */
const SECONDARY: TabSurfacePlacement = {
  id: "secondary",
  label: "Secondary Sidebar",
  stripHeight: 38,
  zIndex: 85,
  collapsible: true,
  resizeAxis: "width",
  defaultSize: 300,
  minSize: 180,
  maxSize: () => 600,
  resizeDelta: (origin, point, swapped) => (swapped ? point.x - origin.x : origin.x - point.x),
  /** The secondary sidebar is a full-height column on the shell's right edge. */
  boxStyle(bounds, size, collapsed) {
    return fixedBox({
      top: `${bounds.top}px`,
      right: 0,
      bottom: 0,
      width: collapsed ? `${COLLAPSED_STRIP}px` : `${size}px`,
      zIndex: SECONDARY.zIndex,
      borderLeft: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
    });
  },
  handleStyle: () => ({ top: 0, bottom: 0, left: "-4px", width: "8px", cursor: "col-resize" }),
};

/** Every surface placement, keyed by surface id. */
export const TAB_SURFACE_PLACEMENTS: Readonly<Record<WorkspaceSurfaceId, TabSurfacePlacement>> = {
  main: MAIN,
  bottom: BOTTOM,
  secondary: SECONDARY,
};

/** Clamps a surface size to its placement's bounds for the current viewport. */
export function clampSurfaceSize(
  placement: TabSurfacePlacement,
  size: number,
  viewport: { readonly width: number; readonly height: number },
): number {
  return Math.round(Math.max(placement.minSize, Math.min(placement.maxSize(viewport), size)));
}
