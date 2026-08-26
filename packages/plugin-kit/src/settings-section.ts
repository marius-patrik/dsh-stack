/**
 * Shared settings-section installation for Stack plugins and extensions:
 * registers a schemastery-backed section with the harness settings service
 * and rewires live updates through a change callback. Sections are read live
 * through their source thunks, so the install-time source stays a no-op.
 * @module plugin-kit/settings-section
 */

import type { Context } from "@deepseek-ai/cordis";
import type z from "@deepseek-ai/schemastery";
import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";

/** A settings namespace as produced by `settingsNamespace`. */
export type SettingsNamespace = ReturnType<typeof settingsNamespace>;

/**
 * Install one settings section: register `schema` under `ns` seeded with
 * `entry`, run `validate` on candidate values when given, and invoke
 * `onChange` whenever the live value changes.
 */
export function installLiveSettingsSection<T>(
  ctx: Context,
  ns: SettingsNamespace,
  schema: z<T>,
  entry: T,
  validate: ((value: T) => void) | undefined,
  onChange: () => void,
): void {
  installSettingsSection(ctx, ns, schema, entry, {
    setSource: () => {
      /* sections are read live through their source thunks */
    },
    onChange,
    ...(validate === undefined ? {} : { validate }),
  });
}
