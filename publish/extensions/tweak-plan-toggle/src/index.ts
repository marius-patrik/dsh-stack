/**
 * `tweak-plan-toggle`: the Plan/Build toggle command plus its
 * `tweaks-plan-toggle` settings section. Split out of the bundled `tweaks`
 * package.
 * @module tweak-plan-toggle
 */

import type { Context } from "@deepseek-ai/cordis";
import type z from "@deepseek-ai/schemastery";
import { installLiveSettingsSection } from "@dsh-stack/plugin-kit";
import { installPlanToggle } from "./plan-toggle.js";
import {
  NS_PLAN_TOGGLE,
  PlanToggleConfig,
  type PlanToggleConfig as PlanToggleConfigType,
} from "./settings.js";

export { NS_PLAN_TOGGLE, PlanToggleConfig } from "./settings.js";
export type { PlanToggleConfig as PlanToggleConfigType } from "./settings.js";
export { installPlanToggle } from "./plan-toggle.js";

export const name = "tweak-plan-toggle";
export const inject: string[] = [];

/** The plan-toggle extension config: the plan-toggle section itself. */
export type Config = PlanToggleConfigType;

export const Config: z<Config> = PlanToggleConfig;

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const session: PlanToggleConfigType = { enabled: config?.enabled ?? true };
  installLiveSettingsSection(ctx, NS_PLAN_TOGGLE, PlanToggleConfig, session, undefined, () => {});
  if (session.enabled) void installPlanToggle(ctx);
}
