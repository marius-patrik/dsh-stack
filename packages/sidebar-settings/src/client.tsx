import { useEffect, useState } from "react";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SettingsSectionOwnerProps } from "@deepseek-ai/dsh-client-ui-settings/client";
import { sidebarPreferences, type SidebarPreferences } from "@dsh-stack/sidebar-preferences";
import type { SidebarPreferenceKey } from "@dsh-stack/sidebar-preferences";

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
    <label htmlFor={id}>
      <span>{label}</span>
      <span>{description}</span>
      <input id={id} type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

/** Renders the sidebar settings section. */
export function SidebarSettings({ close }: SettingsSectionOwnerProps) {
  const [state, setState] = useState<SidebarPreferences>(sidebarPreferences.get());
  useEffect(() => sidebarPreferences.subscribe(() => setState(sidebarPreferences.get())), []);
  const change = (key: SidebarPreferenceKey, value: boolean) => sidebarPreferences.set(key, value);
  return (
    <section aria-label="Sidebar">
      <h2>Sidebar</h2>
      <PreferenceRow id="sidebar-show-brand-logo" label="Show brand logo" description="Show the active skin's logo." checked={state.showBrandLogo} onChange={(value) => change("showBrandLogo", value)} />
      <PreferenceRow id="sidebar-show-new-conversation" label="Show New Conversation" description="Show the New Conversation action." checked={state.showNewConversation} onChange={(value) => change("showNewConversation", value)} />
      <button type="button" onClick={close}>Close</button>
    </section>
  );
}

/** Registers the sidebar settings section with the settings slot registry. */
export function apply(ctx: ClientContext): void {
  ctx.slots.register(
    { name: "settings.general.item", id: "sidebar", order: 30, label: "Sidebar" },
    SidebarSettings,
  );
}
