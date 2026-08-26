import { useEffect, useState } from "react";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SettingsSectionOwnerProps } from "@deepseek-ai/dsh-client-ui-settings/client";
import { sidebarPreferences, type SidebarPreferences } from "@dsh-stack/sidebar-preferences";
import type { SidebarPreferenceKey } from "@dsh-stack/sidebar-preferences";

/** Cordis client services this plugin's `apply` reaches for; activation waits on them. */
export const inject = ["slots"];

/** Renders one persisted sidebar preference as a settings row. */
function PreferenceRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minHeight: 46,
        padding: "10px 12px",
        borderRadius: 9,
        border: "1px solid color-mix(in srgb, currentColor 14%, transparent)",
        cursor: "pointer",
      }}
    >
      <span style={{ display: "grid", gap: 2 }}>
        <span style={{ fontSize: 14 }}>{label}</span>
        <span style={{ fontSize: 12, lineHeight: 1.4, opacity: 0.68 }}>{description}</span>
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

/** Renders the sidebar settings section. */
export function SidebarSettings({ close }: SettingsSectionOwnerProps) {
  const [state, setState] = useState<SidebarPreferences>(sidebarPreferences.get());
  useEffect(() => sidebarPreferences.subscribe(() => setState(sidebarPreferences.get())), []);
  const /** change implementation. */
    change = (key: SidebarPreferenceKey, value: boolean) => sidebarPreferences.set(key, value);
  return (
    <section aria-label="Sidebar" style={{ maxWidth: 720, display: "grid", gap: 18 }}>
      <header>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>Sidebar</h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, opacity: 0.68 }}>
          Choose which elements the DSH Stack sidebar shell renders.
        </p>
      </header>
      <div style={{ display: "grid", gap: 8 }}>
        <PreferenceRow
          id="sidebar-show-brand-logo"
          label="Show brand logo"
          description="Show the active skin's logo."
          checked={state.showBrandLogo}
          onChange={(value) => change("showBrandLogo", value)}
        />
        <PreferenceRow
          id="sidebar-show-new-conversation"
          label="Show New Conversation"
          description="Show the New Conversation action."
          checked={state.showNewConversation}
          onChange={(value) => change("showNewConversation", value)}
        />
      </div>
      <button type="button" onClick={close} style={{ justifySelf: "start" }}>
        Close
      </button>
    </section>
  );
}

/** Registers the sidebar settings section with the settings slot registry. */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      { name: "settings.section", id: "sidebar", order: 30, label: "Sidebar", inject: () => ({}) },
      SidebarSettings,
    ),
  );
}
