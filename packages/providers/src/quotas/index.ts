/**
 * The quotas half of providers (merged from the standalone dsh-quotas
 * plugin): a registry of quota providers, one snapshot per provider, the
 * `/quotas/api/*` web routes with the HTML dashboard, the built-in probe
 * providers with a staggered 15-minute auto-refresh, and the `dsh-quotas`
 * settings section.
 * @module providers/quotas
 */

import type { Context } from "@deepseek-ai/cordis";
import { installSettingsSection } from "@deepseek-ai/dsh-settings";
import type { AccountsService } from "@dsh-stack/credential-vault";
import { NS, QuotaSettings, type QuotaSettings as QuotaSettingsValue } from "./settings.js";
import { mountQuotaWeb } from "./web.js";
import { createBuiltinProviders, PROBE_ROUTE_IDS } from "./providers.js";
import { PROVIDER_IDS } from "../providers.js";
import { createConfiguredProviders } from "./configured.js";
import type { ConfigurableProviderEntry, SettingsDescriptorView } from "./configured.js";

export { NS, QuotaSettings } from "./settings.js";
export type { QuotaProviderConfig, QuotaSettings as QuotaSettingsValue } from "./settings.js";
export { QUOTAS_PREFIX, mountQuotaWeb } from "./web.js";
export { createBuiltinProviders, PROBE_ROUTE_IDS } from "./providers.js";
export {
  createConfiguredProviders,
  probeConfiguredRoute,
  readConfiguredProfile,
  modelsEndpoint,
} from "./configured.js";
export type {
  ConfigurableProviderEntry,
  ConfiguredProbeDeps,
  ConfiguredRouteProfile,
  SettingsDescriptorView,
} from "./configured.js";

export interface QuotaSnapshot {
  provider: string;
  status: "available" | "unknown" | "error";
  used?: number;
  limit?: number;
  remaining?: number;
  unit?: "tokens" | "requests" | "credits" | "currency";
  window?: string;
  resetsAt?: string;
  fetchedAt: string;
  source: "endpoint" | "cli" | "manual";
  message?: string;
}

export interface QuotaProvider {
  readonly id: string;
  read(signal: { readonly aborted: boolean }): Promise<QuotaSnapshot>;
}

export class QuotaRegistry {
  private readonly providers = new Map<string, QuotaProvider>();
  private readonly snapshots = new Map<string, QuotaSnapshot>();

  /** register implementation. */
  register(provider: QuotaProvider): () => void {
    this.providers.set(provider.id, provider);
    return () => {
      if (this.providers.get(provider.id) === provider) this.providers.delete(provider.id);
    };
  }

  /** snapshot implementation. */
  snapshot(provider: string): QuotaSnapshot | undefined {
    return this.snapshots.get(provider);
  }

  /** all implementation. */
  all(): readonly QuotaSnapshot[] {
    return [...this.snapshots.values()];
  }

  /** refresh implementation. */
  async refresh(
    provider: string,
    signal: { readonly aborted: boolean } = { aborted: false },
  ): Promise<QuotaSnapshot> {
    const source = this.providers.get(provider);
    if (source === undefined) {
      const unknown: QuotaSnapshot = {
        provider,
        status: "unknown",
        fetchedAt: new Date().toISOString(),
        source: "manual",
        message: "No verified quota source is configured for this provider.",
      };
      this.snapshots.set(provider, unknown);
      return unknown;
    }
    try {
      const snapshot = await source.read(signal);
      this.snapshots.set(provider, snapshot);
      return snapshot;
    } catch (error) {
      const failed: QuotaSnapshot = {
        provider,
        status: "error",
        fetchedAt: new Date().toISOString(),
        source: "manual",
        message: error instanceof Error ? error.message : String(error),
      };
      this.snapshots.set(provider, failed);
      return failed;
    }
  }
}

declare module "@deepseek-ai/cordis" {
  interface Context {
    quotas: QuotaRegistry;
  }
}

export interface QuotasConfig {
  providers?: QuotaSettingsValue["providers"];
  /**
   * Resolve one probe credential. Defaults to reading the account seam as
   * stored, which is wrong for a subscription route: its access token is
   * short-lived (Kimi's lasts 15 minutes), so a probe reading the stored value
   * reports "Auth failed" for a provider that dispatch refreshes and serves
   * perfectly. The plugin passes a reader that refreshes exactly as dispatch
   * does, so the light reflects whether the credential works rather than how
   * long ago it was written.
   */
  resolveToken?: (ref: string) => Promise<string | undefined>;
}

/**
 * Resolve one credential reference for a probe: the account seam
 * (credentials) first, then the credential environment variable as the
 * fallback. Probes never read vault files directly.
 */
async function resolveProbeToken(ctx: Context, ref: string): Promise<string | undefined> {
  const accounts = ctx.get("accounts") as AccountsService | undefined;
  if (accounts !== undefined) {
    const resolved = await accounts.resolve(ref);
    if (resolved?.value !== undefined && resolved.value.length > 0) return resolved.value;
  }
  return process.env[ref] ?? undefined;
}

/**
 * Mount the quotas registry, settings section, web routes, and the built-in
 * probe providers with their staggered 15-minute auto-refresh.
 */
export function applyQuotas(ctx: Context, config: QuotasConfig = {}): QuotaRegistry {
  const registry = new QuotaRegistry();
  ctx.provide("quotas", registry);
  installSettingsSection(
    ctx,
    NS,
    QuotaSettings,
    { providers: config.providers ?? {} },
    {
      setSource: () => {},
      onChange: () => {},
    },
  );
  mountQuotaWeb(ctx, registry);

  const read =
    config.resolveToken ??
    ((ref: string): Promise<string | undefined> => resolveProbeToken(ctx, ref));
  const builtinProviders = createBuiltinProviders(read);
  const disposers: Array<() => void> = [];
  for (const provider of builtinProviders) {
    disposers.push(registry.register(provider));
  }

  // Providers this plugin does not own — above all the custom
  // OpenAI-compatible routes added through model settings — get a probe too, so
  // every row in a status surface carries a light instead of only the shipped
  // ones. Re-synced before each refresh because the directory changes while the
  // host runs: adding a custom provider must not need a restart to be probed.
  // Every route this plugin owns is covered, not merely the probed ones: an
  // owned route without a probe (kimi-code) must not fall through to the
  // generic prober, which would read the plugin's own settings section, find no
  // baseURL there, and report "no endpoint configured" about a route whose
  // endpoint is declared in code.
  const covered = new Set([...PROBE_ROUTE_IDS, ...PROVIDER_IDS]);
  const configuredIds = new Set<string>();
  const /** syncConfiguredProviders implementation. */
    syncConfiguredProviders = (): void => {
      const llm = ctx.get("llm") as
        | {
            listConfigurableProviders?: () => readonly ConfigurableProviderEntry[];
          }
        | undefined;
      const settingsProvider = ctx.get("settings") as
        | {
            describe?: (options?: { redactSecrets?: boolean }) => readonly SettingsDescriptorView[];
          }
        | undefined;
      if (llm?.listConfigurableProviders === undefined || settingsProvider?.describe === undefined)
        return;
      const listConfigurable = llm.listConfigurableProviders.bind(llm);
      const describe = settingsProvider.describe.bind(settingsProvider);
      for (const provider of createConfiguredProviders({
        listConfigurable,
        // Verbatim, not redacted: the probe needs the real credential reference,
        // and this read never leaves the process.
        describeSettings: () => describe(),
        readToken: read,
        covered: (candidate) => covered.has(candidate),
      })) {
        disposers.push(registry.register(provider));
        configuredIds.add(provider.id);
      }
    };
  syncConfiguredProviders();

  /** Every provider the registry should refresh on a cycle. */
  const probeIds = (): string[] => {
    syncConfiguredProviders();
    return [...builtinProviders.map((provider) => provider.id), ...configuredIds];
  };

  // Initial refresh (staggered by 500ms each to avoid thundering herd)
  const controller = new AbortController();
  const initial: ReturnType<typeof setTimeout>[] = [];
  for (const [i, id] of probeIds().entries()) {
    const timeout = setTimeout(async () => {
      if (controller.signal.aborted) return;
      try {
        await registry.refresh(id, controller.signal);
      } catch {
        /* swallow */
      }
    }, i * 500);
    timeout.unref();
    initial.push(timeout);
  }

  // Periodic auto-refresh (default every 15 minutes)
  const refreshMinutes = 15;
  const timer = setInterval(() => {
    for (const [i, id] of probeIds().entries()) {
      const timeout = setTimeout(async () => {
        try {
          await registry.refresh(id);
        } catch {
          /* swallow */
        }
      }, i * 500);
      timeout.unref();
    }
  }, refreshMinutes * 60_000);
  timer.unref();

  (ctx.on as (event: string, listener: () => void) => void)("dispose", () => {
    controller.abort();
    for (const timeout of initial) clearTimeout(timeout);
    clearInterval(timer);
    for (const d of disposers) d();
  });
  return registry;
}
