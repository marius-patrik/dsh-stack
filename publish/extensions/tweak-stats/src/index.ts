/**
 * `tweak-stats`: session observability — the `tweaks-stats` settings section
 * plus the projection-cache readers powering the `dsh stats` and
 * `dsh sessions` verbs (bin/). Split out of the bundled `tweaks` package.
 * @module tweak-stats
 */

import type { Context } from "@deepseek-ai/cordis";
import type z from "@deepseek-ai/schemastery";
import { installLiveSettingsSection } from "@dsh-stack/plugin-kit";
import { NS_STATS, StatsConfig, type StatsConfig as StatsConfigType } from "./settings.js";

export { NS_STATS, StatsConfig } from "./settings.js";
export type { StatsConfig as StatsConfigType } from "./settings.js";
export * from "./stats.js";

export const name = "tweak-stats";
export const inject: string[] = [];

/** The stats extension config: the stats section itself. */
export type Config = StatsConfigType;

export const Config: z<Config> = StatsConfig;

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const stats: StatsConfigType = {
    enabled: config?.enabled ?? true,
    format: config?.format ?? "table",
  };
  // The CLI verbs read the projection cache directly; no server wiring needed.
  installLiveSettingsSection(ctx, NS_STATS, StatsConfig, stats, undefined, () => {});
}
