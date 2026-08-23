import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "settings-dialog";
export const inject = ["slots", "locale"];
export const optional = ["icons", "profiles", "settings"];

export const Config = Schema.object({
  enableProfilesTab: Schema.boolean().default(true),
  profilesTabLabel: Schema.string().default("Profiles"),
});

export const settingsSections = ["general", "profiles"] as const;

export function apply(ctx: Context, config: Record<string, unknown> = {}) {
  // Uses the normal DSH settings surface. Stack only contributes the Profiles
  // section and its compact selectors; it does not replace the settings shell.
  void ctx;
  void config;
}
