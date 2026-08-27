/**
 * The one tab host. Every workspace surface is this component with a different
 * {@link TabSurfacePlacement}: it owns the chrome, the resize drag, the
 * collapse toggle, the shared strip, the overflow and context menus, the drop
 * target, the body lookup and the empty state.
 *
 * A move is a single `move` dispatch against the shared store, so a tab is
 * always owned by exactly one surface and never by none -- the failure mode
 * that destroyed conversations in issue #122.
 *
 * @module @dsh-stack/workspace-tabs/create-tab-surface
 */
import type { TabContentRegistry, TabContentType } from "./create-tab-content-registry.js";
import { unrenderableTabMessage } from "./create-tab-content-registry.js";
import { TAB_DRAG_TYPE, type TabStripProps } from "./create-tab-strip.js";
import { moveActionTarget, surfaceMenuItems, tabMenuItems } from "./tab-menu-items.js";
import {
  type SurfaceBounds,
  TAB_SURFACE_PLACEMENTS,
  clampSurfaceSize,
} from "./tab-surface-placement.js";
import {
  type RenderedTabMenuItem,
  type TabComponent,
  type TabElement,
  type TabSurfaceChrome,
  type TabSurfaceReact,
  renderMenuItems,
} from "./tab-surface-runtime.js";
import type { WorkspaceTabsStore } from "./create-workspace-tabs-store.js";
import { type WorkspaceSurfaceId, type WorkspaceTab, tabsOnSurface } from "./workspace-tab.js";

/** Geometry the surface reports so the shell can reserve space for it. */
export interface TabSurfaceGeometry {
  readonly surface: WorkspaceSurfaceId;
  readonly open: boolean;
  readonly collapsed: boolean;
  readonly size: number;
  /** The surface's occupied extent as a CSS length, for shell insets. */
  readonly extent: string;
}

/** What one hosted surface renders from. */
export interface TabSurfaceProps {
  readonly surface: WorkspaceSurfaceId;
  readonly bounds: SurfaceBounds;
  readonly open: boolean;
  onOpenChange(open: boolean): void;
  onGeometryChange?(geometry: TabSurfaceGeometry): void;
  /** Shell-owned buttons rendered before the overflow menu. */
  readonly trailingControls?: TabElement;
  /** Shell-owned overflow rows appended below the shared tab rows. */
  readonly extraMenuItems?: readonly RenderedTabMenuItem[];
  onExtraMenuSelect?(actionId: string): void;
}

/** Dependencies the surface factory closes over once, at bundle load. */
export interface TabSurfaceDependencies {
  readonly react: TabSurfaceReact;
  readonly chrome: TabSurfaceChrome;
  readonly store: WorkspaceTabsStore;
  readonly registry: TabContentRegistry;
  readonly TabStrip: TabComponent;
  readonly EmptySurfacePicker: TabComponent;
}

/** Menu state: either a right-clicked tab, the overflow button, or nothing. */
type OpenMenu =
  | {
      readonly kind: "tab";
      readonly tab: WorkspaceTab;
      readonly position: { x: number; y: number };
    }
  | { readonly kind: "surface" }
  | { readonly kind: "new-tab"; readonly anchor: { current: unknown } }
  | null;

const HEADER_STYLE: Record<string, string | number> = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "6px",
  padding: "0 6px 0 10px",
  background: "var(--dsw-alias-surface-l0, #13141f)",
  borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))",
  userSelect: "none",
  flex: "0 0 auto",
};

const CONTROL_BUTTON: Record<string, string | number> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "26px",
  height: "26px",
  borderRadius: "6px",
  border: "none",
  background: "transparent",
  color: "var(--dsw-alias-label-secondary)",
  cursor: "pointer",
};

/** Builds the shared surface host bound to one store and content registry. */
export function createTabSurface(dependencies: TabSurfaceDependencies): TabComponent {
  const { react, chrome, store, registry } = dependencies;
  const h = react.createElement;

  /** Renders one workspace surface. */
  return function TabSurface(props: TabSurfaceProps): TabElement {
    const placement = TAB_SURFACE_PLACEMENTS[props.surface];
    const [, setRevision] = react.useState(0);
    const [size, setSize] = react.useState(placement.defaultSize);
    const [collapsed, setCollapsed] = react.useState(false);
    const [menu, setMenu] = react.useState<OpenMenu>(null);
    const overflowRef = react.useRef<unknown>(null);

    react.useEffect(() => store.subscribe(() => setRevision((revision) => revision + 1)), []);

    const state = store.getState();
    const tabs = tabsOnSurface(state, props.surface);
    const activeId = state.active[props.surface];
    const activeTab = activeId ? state.tabs[activeId] : undefined;

    react.useEffect(() => {
      if (tabs.length === 0) return;
      if (!props.open) props.onOpenChange(true);
      if (collapsed) setCollapsed(false);
    }, [tabs.length]);

    const extent = collapsed ? `${placement.stripHeight}px` : `${size}px`;
    react.useEffect(() => {
      props.onGeometryChange?.({
        surface: props.surface,
        open: props.open,
        collapsed,
        size,
        extent: props.open ? extent : "0px",
      });
    }, [props.open, collapsed, size, extent]);

    /** Applies one menu or context-menu action id. */
    const runAction = (actionId: string, tab: WorkspaceTab | undefined): void => {
      setMenu(null);
      const target = moveActionTarget(actionId);
      if (target && tab) {
        store.dispatch({ type: "move", tabId: tab.id, surface: target });
        return;
      }
      if (actionId === "close" && tab) {
        store.dispatch({ type: "close", tabId: tab.id });
        return;
      }
      if (actionId === "close-others" && tab) {
        store.dispatch({ type: "close-others", tabId: tab.id });
        return;
      }
      if (actionId === "collapse") {
        setCollapsed(!collapsed);
        return;
      }
      props.onExtraMenuSelect?.(actionId);
    };

    /** Starts a pointer drag on the surface's resize handle. */
    const startResize = (event: {
      preventDefault(): void;
      clientX: number;
      clientY: number;
    }): void => {
      event.preventDefault();
      const origin = { x: event.clientX, y: event.clientY };
      const startSize = size;
      const swapped = document.body.classList.contains("dsh-sidebars-swapped");
      /** Resizes the surface to follow the pointer. */
      const onMove = (moveEvent: PointerEvent): void => {
        const delta = placement.resizeDelta(
          origin,
          { x: moveEvent.clientX, y: moveEvent.clientY },
          swapped,
        );
        setSize(
          clampSurfaceSize(placement, startSize + delta, {
            width: window.innerWidth,
            height: window.innerHeight,
          }),
        );
      };
      /** Ends the drag and detaches its document listeners. */
      const onUp = (): void => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    };

    /** Takes ownership of a tab dropped onto this surface, in one dispatch. */
    const acceptDrop = (event: {
      preventDefault(): void;
      dataTransfer: { getData(type: string): string };
    }): void => {
      event.preventDefault();
      const raw = event.dataTransfer.getData(TAB_DRAG_TYPE);
      if (!raw) return;
      const dropped = JSON.parse(raw) as WorkspaceTab;
      setCollapsed(false);
      props.onOpenChange(true);
      if (store.getState().tabs[dropped.id]) {
        store.dispatch({ type: "move", tabId: dropped.id, surface: props.surface });
        return;
      }
      store.dispatch({ type: "open", tab: dropped, surface: props.surface });
    };

    /** Opens a freshly created tab of `type` on this surface. */
    const createTab = (type: TabContentType): void => {
      setMenu(null);
      const created = type.create?.(props.surface);
      if (!created) {
        throw new Error(
          `Tab kind "${type.kind}" offered a new-tab entry but produced no tab for the ${placement.label}.`,
        );
      }
      store.dispatch({ type: "open", tab: created, surface: props.surface });
    };

    if (!props.open) return null;

    const contentType = activeTab ? registry.get(activeTab.kind) : undefined;
    const body = ((): TabElement | null => {
      if (collapsed) return null;
      if (!activeTab) {
        return h(dependencies.EmptySurfacePicker, {
          placement,
          registry,
          onCreate: createTab,
        });
      }
      if (!contentType) {
        return h(
          "div",
          {
            className: "dsh-tab-surface-unrenderable",
            style: { flex: 1, padding: "24px", fontSize: "13px" },
          },
          unrenderableTabMessage(activeTab),
        );
      }
      return contentType.render(activeTab, props.surface);
    })();

    const stripProps: TabStripProps = {
      placement,
      tabs,
      activeTabId: activeId,
      onActivate: (tabId) => store.dispatch({ type: "activate", tabId }),
      onClose: (tabId) => store.dispatch({ type: "close", tabId }),
      onContextMenu: (tab, position) => setMenu({ kind: "tab", tab, position }),
      onNewTab: (anchor) => setMenu({ kind: "new-tab", anchor }),
    };

    const menuRows: readonly RenderedTabMenuItem[] =
      menu?.kind === "tab"
        ? renderMenuItems(chrome, tabMenuItems(state, menu.tab, props.surface))
        : menu?.kind === "surface"
          ? [
              ...renderMenuItems(chrome, surfaceMenuItems(state, props.surface, collapsed)),
              ...(props.extraMenuItems ?? []),
            ]
          : menu?.kind === "new-tab"
            ? registry.creatable().map((type) => ({
                id: `new:${type.kind}`,
                label: type.label,
                icon: chrome.tabGlyph(type.kind, 13),
              }))
            : [];

    return h(
      "div",
      {
        className: `dsh-tab-surface dsh-tab-surface-${props.surface}`,
        style: {
          ...placement.boxStyle(props.bounds, size, collapsed, body !== null),
          background: body === null ? "transparent" : "var(--dsw-alias-bg-layer-0, #000000)",
          fontFamily: "var(--ds-font-family, system-ui, sans-serif)",
        },
        onDragOver: (event: { preventDefault(): void; dataTransfer: { dropEffect: string } }) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        },
        onDrop: acceptDrop,
      },
      placement.handleStyle() && !collapsed
        ? h("div", {
            key: "resize",
            onPointerDown: startResize,
            style: { position: "absolute", zIndex: 10, ...placement.handleStyle() },
          })
        : null,
      h(
        "div",
        { key: "header", style: { ...HEADER_STYLE, height: `${placement.stripHeight}px` } },
        h(dependencies.TabStrip, stripProps),
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "2px", flex: "0 0 auto" } },
          props.trailingControls ?? null,
          h(
            "button",
            {
              ref: overflowRef,
              type: "button",
              title: `${placement.label} Actions`,
              "aria-label": `${placement.label} Actions`,
              style: CONTROL_BUTTON,
              onClick: (event: { stopPropagation(): void }) => {
                event.stopPropagation();
                setMenu(menu?.kind === "surface" ? null : { kind: "surface" });
              },
            },
            chrome.menuGlyph("overflow", 14),
          ),
          placement.collapsible
            ? h(
                "button",
                {
                  type: "button",
                  title: `${collapsed ? "Expand" : "Collapse"} ${placement.label}`,
                  "aria-label": `${collapsed ? "Expand" : "Collapse"} ${placement.label}`,
                  style: CONTROL_BUTTON,
                  onClick: () => setCollapsed(!collapsed),
                },
                chrome.menuGlyph(collapsed ? "expand" : "collapse", 14),
              )
            : null,
        ),
      ),
      body === null
        ? null
        : h(
            "div",
            {
              key: "body",
              className: "dsh-tab-surface-body",
              style: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" },
            },
            body,
          ),
      menu === null
        ? null
        : h(
            "div",
            // A zero-size anchor: the dropdown dismisses on any click outside its
            // own parent, which must therefore not be the whole surface.
            { key: "menu", style: { position: "relative", width: 0, height: 0 } },
            h(chrome.DropdownMenu, {
              open: true,
              anchorRef:
                menu.kind === "surface"
                  ? overflowRef
                  : menu.kind === "new-tab"
                    ? menu.anchor
                    : undefined,
              position: menu.kind === "tab" ? menu.position : undefined,
              items: menuRows,
              onClose: () => setMenu(null),
              onSelect: (actionId: string) => {
                if (menu.kind === "new-tab") {
                  const type = registry
                    .creatable()
                    .find((candidate) => `new:${candidate.kind}` === actionId);
                  if (type) createTab(type);
                  return;
                }
                runAction(actionId, menu.kind === "tab" ? menu.tab : activeTab);
              },
            }),
          ),
    );
  };
}
