import { useEffect, useState } from "react";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SettingsSectionOwnerProps } from "@deepseek-ai/dsh-client-ui-settings/client";
import {
  SETTINGS_SECTION_ICON_SLOT,
  SettingsSection,
  SettingsOptionRow,
} from "@dsh-stack/settings-panel";
import { PaletteIcon } from "@dsh-stack/lucide-animated/client";
import { createSkinRuntime, defaultSkins, type SkinId } from "@dsh-stack/skin-runtime";

/** Cordis client services this plugin's `apply` reaches for; activation waits on them. */
export const inject = ["slots"];

const runtime = createSkinRuntime(undefined, () => window.location.reload());

/** SkinSettings implementation. */
export function SkinSettings({ close }: SettingsSectionOwnerProps) {
  const [active, setActive] = useState<SkinId>(runtime.getActive());
  useEffect(() => runtime.subscribe(() => setActive(runtime.getActive())), []);

  return (
    <SettingsSection
      label="Skins"
      title="Skins"
      description="Change the DSH Stack visual identity. The selected skin controls branding assets without changing the sidebar implementation."
      onClose={close}
    >
      {defaultSkins.map((skin) => (
        <SettingsOptionRow
          key={skin.id}
          label={skin.label}
          selected={active === skin.id}
          onSelect={() => {
            setActive(skin.id);
            runtime.setActive(skin.id);
          }}
        />
      ))}
    </SettingsSection>
  );
}

/** Renders the Skins section's nav glyph from the canonical animated icon set. */
export function SkinSettingsIcon() {
  return <PaletteIcon aria-hidden="true" size={16} />;
}

/** apply implementation. */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      { name: "settings.section", id: "skins", order: 35, label: "Skins", inject: () => ({}) },
      SkinSettings,
    ),
  );
  ctx.slots.inject(SETTINGS_SECTION_ICON_SLOT, () =>
    ctx.slots.register(
      { name: SETTINGS_SECTION_ICON_SLOT, id: "skins", order: 0 },
      SkinSettingsIcon,
    ),
  );
}
