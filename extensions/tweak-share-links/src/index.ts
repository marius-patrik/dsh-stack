/**
 * `tweak-share-links`: self-hosted read-only share links — the
 * `<basePath>/<id>` snapshot route on the harness web server plus the
 * `tweaks-share` settings section. Split out of the bundled `tweaks`
 * package; plugs into the tweaks settings surface.
 * @module tweak-share-links
 */

import type { Context } from "@deepseek-ai/cordis";
import type z from "@deepseek-ai/schemastery";
import { installLiveSettingsSection } from "@dsh-stack/plugin-kit";
import { resolveHome } from "@dsh-stack/tweaks";
import { mountShareRoute } from "./share.js";
import { NS_SHARE, ShareConfig, type ShareConfig as ShareConfigType } from "./settings.js";

export { NS_SHARE, ShareConfig } from "./settings.js";
export type { ShareConfig as ShareConfigType } from "./settings.js";
export { generateToken, mountShareRoute, writeShareToken } from "./share.js";

export const name = "tweak-share-links";
export const inject: string[] = [];

/** The share-links extension config: the share section itself. */
export type Config = ShareConfigType;

export const Config: z<Config> = ShareConfig;

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const share: ShareConfigType = {
    enabled: config?.enabled ?? true,
    allowInteractive: config?.allowInteractive ?? false,
    advertisedHost: config?.advertisedHost ?? "",
    basePath: config?.basePath ?? "/share",
  };
  installLiveSettingsSection(ctx, NS_SHARE, ShareConfig, share, undefined, () => {});
  mountShareRoute(ctx, resolveHome(), share);
}
