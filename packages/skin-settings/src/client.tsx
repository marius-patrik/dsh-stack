import { useEffect, useState } from "react";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SettingsSectionOwnerProps } from "@deepseek-ai/dsh-client-ui-settings/client";
import { createSkinRuntime, defaultSkins, type SkinId } from "@dsh-stack/skin-runtime";

const runtime = createSkinRuntime(undefined, () => window.location.reload());

export function SkinSettings({ close }: SettingsSectionOwnerProps) {
  const [active, setActive] = useState<SkinId>(runtime.getActive());
  useEffect(() => runtime.subscribe(() => setActive(runtime.getActive())), []);

  return (
    <section aria-label="Skins" style={{ maxWidth: 720, display: "grid", gap: 18 }}>
      <header>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>Skins</h2>
        <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, opacity: 0.68 }}>
          Change the DSH Stack visual identity. The selected skin controls branding assets without
          changing the sidebar implementation.
        </p>
      </header>
      <div style={{ display: "grid", gap: 8 }}>
        {defaultSkins.map((skin) => {
          const selected = active === skin.id;
          return (
            <button
              key={skin.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setActive(skin.id);
                runtime.setActive(skin.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                minHeight: 46,
                padding: "0 12px",
                borderRadius: 9,
                border: "1px solid color-mix(in srgb, currentColor 14%, transparent)",
                background: selected
                  ? "color-mix(in srgb, currentColor 7%, transparent)"
                  : "transparent",
                color: "inherit",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              <span>{skin.label}</span>
              {selected ? <span aria-hidden="true">✓</span> : null}
            </button>
          );
        })}
      </div>
      <button type="button" onClick={close} style={{ justifySelf: "start" }}>
        Close
      </button>
    </section>
  );
}

export function apply(ctx: ClientContext): void {
  ctx.slots.register(
    { name: "settings.section", id: "skins", order: 35, label: "Skins" },
    SkinSettings,
  );
}
