import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

/**
 * The quotas settings namespace keeps the browser-facing `dsh-quotas` id so
 * the tweaks nav and any stored user settings survive the merge of the
 * standalone dsh-quotas plugin into dsh-providers.
 */
export const NS = settingsNamespace("dsh-quotas");

export interface QuotaProviderConfig {
  enabled: boolean;
  refreshMinutes: number;
}

export interface QuotaSettings {
  providers: Record<string, QuotaProviderConfig>;
}

const QuotaProviderConfig: z<QuotaProviderConfig> = z.object({
  enabled: z.boolean().default(true),
  refreshMinutes: z.number().default(15),
});

export const QuotaSettings: z<QuotaSettings> = z.object({
  providers: z.dict(QuotaProviderConfig).default({}),
});
