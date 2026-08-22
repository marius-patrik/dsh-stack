import { useEffect, useState } from 'react';
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { SettingsSectionOwnerProps } from '@deepseek-ai/dsh-client-ui-settings/client';
import { sidebarPreferences, type SidebarPreferences } from '@dsh-stack/sidebar-preferences';
import type { SidebarPreferenceKey } from '@dsh-stack/sidebar-preferences';

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
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 16,
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid color-mix(in srgb, currentColor 10%, transparent)',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'grid', gap: 4 }}>
        <span style={{ fontWeight: 520 }}>{label}</span>
        <span style={{ fontSize: 12, lineHeight: 1.45, opacity: 0.65 }}>{description}</span>
      </span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ width: 18, height: 18, accentColor: 'currentColor' }}
      />
    </label>
  );
}

export function SidebarSettings({ close }: SettingsSectionOwnerProps) {
  const [state, setState] = useState<SidebarPreferences>(sidebarPreferences.get());
  useEffect(() => sidebarPreferences.subscribe(() => setState(sidebarPreferences.get())), []);

  const change = (key: SidebarPreferenceKey, value: boolean) => sidebarPreferences.set(key, value);

  return (
    <section aria-label="Sidebar" style={{ maxWidth: 720, display: 'grid', gap: 18 }}>
      <header>
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 650 }}>Sidebar</h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.5, opacity: 0.68 }}>
          Control sidebar branding and navigation density without replacing the standard DSH settings shell.
        </p>
      </header>

      <div>
        <PreferenceRow
          id="sidebar-show-brand-logo"
          label="Show brand logo"
          description="Show the active skin's logo in both the expanded header and collapsed rail."
          checked={state.showBrandLogo}
          onChange={(value) => change('showBrandLogo', value)}
        />
        <PreferenceRow
          id="sidebar-show-new-conversation"
          label="Show New Conversation"
          description="Show the large New Conversation action above Files. The keyboard command remains available when hidden."
          checked={state.showNewConversation}
          onChange={(value) => change('showNewConversation', value)}
        />
      </div>

      <button type="button" onClick={close} style={{ justifySelf: 'start' }}>
        Close
      </button>
    </section>
  );
}

export function apply(ctx: ClientContext): void {
  ctx.slots.register(
    { name: 'stack-sidebar-settings', id: 'sidebar', order: 30, label: 'Sidebar' },
    SidebarSettings,
  );
}
