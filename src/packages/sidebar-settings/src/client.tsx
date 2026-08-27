import { useEffect, useState } from "react";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SettingsSectionOwnerProps } from "@deepseek-ai/dsh-client-ui-settings/client";
import { SettingsOptionRow, SettingsSection, SettingsToggleRow } from "@dsh-stack/settings-panel";
import { sidebarPreferences, type SidebarPreferences } from "@dsh-stack/sidebar-preferences";
import type { SidebarTreeLayout } from "@dsh-stack/sidebar-preferences";

/** Cordis client services this plugin's `apply` reaches for; activation waits on them. */
export const inject = ["slots"];

/** The two sidebar tree arrangements a user picks between, with their copy. */
const TREE_LAYOUT_CHOICES: readonly { readonly id: SidebarTreeLayout; readonly label: string }[] = [
  { id: "sections", label: "Split sections — each group in its own block" },
  { id: "unified", label: "Unified tree — every group under one root" },
];

/** Renders the sidebar settings section. */
export function SidebarSettings({ close }: SettingsSectionOwnerProps) {
  const [state, setState] = useState<SidebarPreferences>(sidebarPreferences.get());
  useEffect(() => sidebarPreferences.subscribe(() => setState(sidebarPreferences.get())), []);
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
        onChange={(value) => sidebarPreferences.set("showBrandLogo", value)}
      />
      <SettingsToggleRow
        id="sidebar-show-new-conversation"
        label="Show New Conversation"
        description="Show the New Conversation action."
        checked={state.showNewConversation}
        onChange={(value) => sidebarPreferences.set("showNewConversation", value)}
      />
      {TREE_LAYOUT_CHOICES.map((choice) => (
        <SettingsOptionRow
          key={choice.id}
          label={choice.label}
          selected={state.treeLayout === choice.id}
          onSelect={() => sidebarPreferences.set("treeLayout", choice.id)}
        />
      ))}
    </SettingsSection>
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
