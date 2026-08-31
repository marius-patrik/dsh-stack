import { useEffect, useState } from "react";
import {
  FishLogo,
  IconNewChatOutline16,
  IconPanelLeftOutline16,
  Tooltip,
} from "@deepseek-ai/dsh-client-ui-primitives";
import type { SidebarRootComponentProps } from "@deepseek-ai/dsh-client-ui-sidebar/client";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type {} from "@dsh-stack/sidebar-preferences/client";
import { SidebarOptionsMenu } from "./SidebarOptionsMenu.js";

const railWidth = 56;
const transition = "width 180ms ease, opacity 150ms ease";

export type SidebarRootProps = SidebarRootComponentProps & {
  sidebarPreferences: ClientContext["sidebarPreferences"];
};

/** SidebarRoot implementation. */
export function SidebarRoot({
  collapsed,
  width,
  startSession,
  toggleSidebar,
  t,
  renderSlot,
  sidebarPreferences,
}: SidebarRootProps) {
  const [preferences, setPreferences] = useState(sidebarPreferences.get());

  useEffect(
    () => sidebarPreferences.subscribe(() => setPreferences(sidebarPreferences.get())),
    [sidebarPreferences],
  );

  const wide = !collapsed;
  const contentWidth = wide ? width : railWidth;
  const showBrand = preferences.showBrandLogo;

  return (
    <aside
      data-dsh-plugin="stack-sidebar"
      data-dsh-part="sidebar-shell"
      style={{
        width: contentWidth,
        minWidth: contentWidth,
        maxWidth: contentWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: wide ? "row" : "column",
          alignItems: "center",
          justifyContent: wide ? "space-between" : "center",
          gap: wide ? 0 : 4,
          minHeight: 48,
          padding: wide ? "8px 10px 4px" : "8px 6px 4px",
        }}
      >
        {wide && showBrand ? (
          <button
            type="button"
            onClick={() => startSession()}
            aria-label={t("session.new.label")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
              border: 0,
              background: "transparent",
              color: "inherit",
              padding: 4,
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {renderSlot("sidebar.brand.mark", { size: 24 }, { fallback: <FishLogo size={24} /> })}
            {renderSlot(
              "sidebar.brand.name",
              {},
              { fallback: <span style={{ fontWeight: 600 }}>DSH</span> },
            )}
          </button>
        ) : showBrand ? (
          <span aria-hidden="true" style={{ width: 32, height: 32 }}>
            {renderSlot("sidebar.brand.mark", { size: 24 }, { fallback: <FishLogo size={24} /> })}
          </span>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          {wide ? (
            <SidebarOptionsMenu
              showFiles={preferences.showFiles}
              onShowFilesChange={(value) => sidebarPreferences.set("showFiles", value)}
            />
          ) : null}

          <Tooltip label={collapsed ? "Expand sidebar" : "Collapse sidebar"} delayMs={500}>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={toggleSidebar}
              style={{
                width: 34,
                height: 34,
                display: "grid",
                placeItems: "center",
                border: 0,
                borderRadius: 8,
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
              }}
            >
              <IconPanelLeftOutline16 size={wide ? 16 : 18} />
            </button>
          </Tooltip>
        </div>
      </div>

      {preferences.showNewConversation ? (
        <div style={{ padding: wide ? "2px 10px 8px" : "2px 6px 8px" }}>
          <Tooltip label={t("session.new.label")} delayMs={500} disabled={wide}>
            <button
              type="button"
              aria-label={t("session.new.label")}
              onClick={() => startSession()}
              style={{
                width: "100%",
                minHeight: 38,
                display: "flex",
                alignItems: "center",
                justifyContent: wide ? "flex-start" : "center",
                gap: 8,
                padding: wide ? "0 10px" : 0,
                border: "1px solid color-mix(in srgb, currentColor 14%, transparent)",
                borderRadius: 9,
                background: "color-mix(in srgb, currentColor 6%, transparent)",
                color: "inherit",
                cursor: "pointer",
                font: "inherit",
              }}
            >
              <IconNewChatOutline16 size={wide ? 15 : 18} />
              {wide ? <span>{t("session.new")}</span> : null}
            </button>
          </Tooltip>
        </div>
      ) : null}

      <div style={{ minHeight: 0, flex: 1, overflow: "hidden" }}>
        {preferences.showFiles
          ? renderSlot("sidebar.workspaces", {
              wide,
              expandSidebar: () => {
                if (collapsed) toggleSidebar();
              },
            })
          : null}
      </div>

      <div style={{ flexShrink: 0, padding: wide ? "8px 10px 10px" : "8px 6px 10px" }}>
        <div style={{ display: "grid", gap: 2 }}>
          {renderSlot("sidebar.footer.action", { wide })}
        </div>
        <div style={{ marginTop: 2 }}>{renderSlot("sidebar.settings", { wide })}</div>
      </div>
    </aside>
  );
}
