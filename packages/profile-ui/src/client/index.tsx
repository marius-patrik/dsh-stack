import { useState } from "react";
import { Menu } from "@deepseek-ai/dsh-client-ui-primitives";
import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SettingsSectionOwnerProps } from "@deepseek-ai/dsh-client-ui-settings/client";
import type { SidebarFooterActionOwnerProps } from "@deepseek-ai/dsh-client-ui-sidebar/client";
import type {} from "@deepseek-ai/dsh-client-ui-settings/client";
import type {} from "@deepseek-ai/dsh-client-ui-sidebar/client";
import { CheckIcon, SettingsIcon } from "@dsh-stack/lucide-animated/client";
import { createProfileRuntime } from "@dsh-stack/profile-runtime";
import { profileOptions } from "../index.js";

const runtime = createProfileRuntime(profileOptions, { reload: () => window.location.reload() });
export const inject = ["slots"];

/** Render the compact or expanded profile selector in the sidebar footer. */
function ProfileSelector({ wide }: SidebarFooterActionOwnerProps) {
  const [open, setOpen] = useState(false);
  const active = runtime.getActive();
  const activeOption = profileOptions.find((option) => option.id === active) ?? profileOptions[0]!;
  return (
    <Menu
      open={open}
      onClose={() => setOpen(false)}
      items={profileOptions.map((option) => ({ id: option.id, label: option.label }))}
      selectedIds={[activeOption.id]}
      onSelect={(id) => {
        setOpen(false);
        runtime.setActive(id);
      }}
      align="start"
      dense
      portal
      anchor={
        <button
          type="button"
          aria-label="Switch profile"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          title={activeOption.label}
          style={{
            width: "100%",
            minHeight: 34,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: wide ? "0 10px" : 0,
            justifyContent: wide ? "flex-start" : "center",
            border: 0,
            borderRadius: 8,
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          <SettingsIcon aria-hidden="true" size={18} />
          {wide ? (
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeOption.label}
            </span>
          ) : null}
        </button>
      }
    />
  );
}

/** Render the profile selection section inside the settings surface. */
function ProfileSettings({ close }: SettingsSectionOwnerProps) {
  const [active, setActive] = useState(runtime.getActive());
  return (
    <section aria-label="Profiles" style={{ display: "grid", gap: 12 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Profiles</h2>
        <p style={{ margin: "6px 0 0", opacity: 0.72, lineHeight: 1.45 }}>
          Switch the active Stack composition. The new profile is applied after the interface
          reloads.
        </p>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {profileOptions.map((option) => {
          const selected = option.id === active;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setActive(option.id);
                runtime.setActive(option.id);
              }}
              aria-pressed={selected}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                minHeight: 44,
                padding: "0 12px",
                borderRadius: 8,
                border: "1px solid var(--ds-border, rgba(127,127,127,.22))",
                background: selected
                  ? "var(--ds-surface-secondary, rgba(127,127,127,.12))"
                  : "transparent",
                color: "inherit",
                cursor: "pointer",
                font: "inherit",
                textAlign: "left",
              }}
            >
              <span>{option.label}</span>
              {selected ? <CheckIcon aria-hidden="true" size={18} /> : null}
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

/** Mount the profile selector and settings section into the client slot registry. */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject("sidebar.footer.action", () =>
    ctx.slots.register({ name: "sidebar.footer.action", id: "profiles" }, ProfileSelector),
  );
  ctx.slots.inject("settings.section", () =>
    ctx.slots.register(
      {
        name: "settings.section",
        id: "profiles",
        order: 40,
        label: "Profiles",
        inject: () => ({}),
      },
      ProfileSettings,
    ),
  );
}
