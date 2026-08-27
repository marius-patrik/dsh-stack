/**
 * The seam between this package and whichever client bundle hosts it. The tab
 * surfaces are built as factories over an injected React and an injected set of
 * shell glyphs, so the package carries no React dependency of its own and the
 * host keeps ownership of its icon set and dropdown primitive.
 *
 * @module @dsh-stack/workspace-tabs/tab-surface-runtime
 */
import type { TabMenuGlyph, TabMenuItem } from "./tab-menu-items.js";
import type { WorkspaceTabKind } from "./workspace-tab.js";

/** A rendered node. Opaque here: only the host's React ever inspects it. */
export type TabElement = unknown;

/** A React component or intrinsic tag name accepted by `createElement`. */
export type TabComponent = unknown;

/** The subset of React the tab surfaces use. */
export interface TabSurfaceReact {
  createElement(type: TabComponent, props: object | null, ...children: unknown[]): TabElement;
  useState<T>(initial: T | (() => T)): [T, (next: T | ((previous: T) => T)) => void];
  useEffect(effect: () => (() => void) | void, deps?: readonly unknown[]): void;
  useRef<T>(initial: T): { current: T };
  readonly Fragment: TabComponent;
}

/** Props the host's dropdown primitive is driven with. */
export interface TabMenuAnchor {
  readonly open: boolean;
  readonly anchorRef?: { current: unknown };
  readonly position?: { readonly x: number; readonly y: number };
}

/** Shell-owned rendering the surfaces borrow rather than reimplement. */
export interface TabSurfaceChrome {
  /** The leading glyph for a tab of `kind`. */
  tabGlyph(kind: WorkspaceTabKind, size: number): TabElement;
  /** A named menu/control glyph. */
  menuGlyph(glyph: TabMenuGlyph | "plus" | "overflow", size: number): TabElement;
  /** The host's dropdown menu component, driven with {@link TabMenuAnchor}. */
  readonly DropdownMenu: TabComponent;
}

/** A menu row once its glyph has been resolved to a rendered node. */
export interface RenderedTabMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: TabElement;
  readonly danger?: boolean;
}

/** Resolves each row's named glyph through the host chrome. */
export function renderMenuItems(
  chrome: TabSurfaceChrome,
  items: readonly TabMenuItem[],
): readonly RenderedTabMenuItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label,
    icon: chrome.menuGlyph(item.glyph, 13),
    danger: item.danger,
  }));
}
