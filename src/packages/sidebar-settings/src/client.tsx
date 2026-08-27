import { useEffect, useState } from "react";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SettingsSectionOwnerProps } from "@deepseek-ai/dsh-client-ui-settings/client";
import {
  SETTINGS_SECTION_ICON_SLOT,
  SettingsSection,
  SettingsToggleRow,
} from "@dsh-stack/settings-panel";
import { PanelLeftIcon } from "@dsh-stack/lucide-animated/client";
import { sidebarPreferences, type SidebarPreferences } from "@dsh-stack/sidebar-preferences";
import type { SidebarPreferenceKey } from "@dsh-stack/sidebar-preferences";

/** Cordis client services this plugin's `apply` reaches for; activation waits on them. */
export const inject = ["slots"];

/** Renders the sidebar settings section. */
export function SidebarSettings({ close }: SettingsSectionOwnerProps) {
  const [state, setState] = useState<SidebarPreferences>(sidebarPreferences.get());
  useEffect(() => sidebarPreferences.subscribe(() => setState(sidebarPreferences.get())), []);
  const /** change implementation. */
    change = (key: SidebarPreferenceKey, value: boolean) => sidebarPreferences.set(key, value);
  return (
    <SettingsSection
      label="Sidebar"
      title="Sidebar"
      description="Choose which elements the DSH Stack sidebar shell renders."
      onClose={close}
    >
      <SettingsToggleRow
        id="sidebar-show-brand-logo"
        label="Show brand logo"
        description="Show the active skin's logo."
        checked={state.showBrandLogo}
        onChange={(value) => change("showBrandLogo", value)}
      />
      <SettingsToggleRow
        id="sidebar-show-new-conversation"
        label="Show New Conversation"
        description="Show the New Conversation action."
        checked={state.showNewConversation}
        onChange={(value) => change("showNewConversation", value)}
      />
      <SettingsToggleRow
        id="sidebar-show-files"
        label="Show files"
        description="Show the file/workspace tree region."
        checked={state.showFiles}
        onChange={(value) => change("showFiles", value)}
      />
    </SettingsSection>
  );
}

/** Renders the Sidebar section's nav glyph from the canonical animated icon set. */
export function SidebarSettingsIcon() {
  return <PanelLeftIcon aria-hidden="true" size={16} />;
}

/** Registers the sidebar settings section with the settings slot registry. */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      { name: "settings.section", id: "sidebar", order: 30, label: "Sidebar", inject: () => ({}) },
      SidebarSettings,
    ),
  );
  ctx.slots.inject(SETTINGS_SECTION_ICON_SLOT, () =>
    ctx.slots.register(
      { name: SETTINGS_SECTION_ICON_SLOT, id: "sidebar", order: 0 },
      SidebarSettingsIcon,
    ),
  );
}
