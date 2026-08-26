/**
 * tweak-plan-toggle settings: the Plan/Build toggle section schema.
 * @module tweak-plan-toggle/settings
 */

import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

/** Namespace of the plan-toggle section. */
export const NS_PLAN_TOGGLE = settingsNamespace("tweaks-plan-toggle");

/** Plan-toggle knobs. */
export interface PlanToggleConfig {
  /** Whether the Plan/Build toggle command is registered. */
  enabled: boolean;
}

export const PlanToggleConfig: z<PlanToggleConfig> = z.object({
  enabled: z.boolean().default(true),
});
