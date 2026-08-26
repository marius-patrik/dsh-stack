/**
 * `lsp`: owns the LSP capability on the web profile. The harness ships the
 * LSP service definition (`ctx.lsp`), a generic stdio provider
 * (`dsh-lsp-stdio`), and a model-facing `lsp` tool (`dsh-tool-lsp`) — but
 * composes none of them by default, and its LSP operation set is a closed
 * compile-time union (no formatting: that is `formatters`' job). This
 * plugin mounts the trio through `ctx.plugin` and feeds the stdio provider
 * the server table from the `lsp` settings section, so the agent's
 * `goToDefinition`/`findReferences`/`goToImplementation`/`hover` queries work
 * out of the box. The `dsh lsp` CLI (bin/lsp.mjs) manages the table; changes
 * apply on the next boot (mounts are boot-time, not hot-reloaded).
 * @module lsp
 */

import type { Context } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import { installSettingsSection } from "@deepseek-ai/dsh-settings";
import Lsp from "@deepseek-ai/dsh-lsp";
import * as LspStdio from "@deepseek-ai/dsh-lsp-stdio";
import * as ToolLsp from "@deepseek-ai/dsh-tool-lsp";
import { NS, LspConfig, LspSettings, type LspSettings as LspSettingsType } from "./settings.js";

export type * from "./settings.js";

export const name = "lsp";
export const inject: string[] = [];

export const Config: z<LspConfig> = LspConfig;

/**
 * Merge the plugin's entry server table under the live settings section
 * (settings win). Pure: exported for direct unit verification.
 */
export function mergeServers(
  entry: LspConfig["servers"],
  live: LspSettingsType | undefined,
): Record<string, LspSettingsType["servers"][string]> {
  return { ...(entry ?? {}), ...(live?.servers ?? {}) };
}

/**
 * Mount the LSP service definition, the stdio provider (only when at least
 * one server is configured — `lsp-stdio` refuses an empty table), and the
 * model-facing tool. Servers merge entry config under settings (settings win).
 * @param ctx - the plugin context.
 * @param config - the plugin's deployment configuration.
 */
export function apply(ctx: Context, config: LspConfig): void {
  installSettingsSection(
    ctx,
    NS,
    LspSettings,
    { servers: {} },
    {
      setSource: () => {
        /* the mounts read the live section at settings attach */
      },
      onChange: () => {},
    },
  );

  ctx.inject(["settings"], async (sctx) => {
    const merged = mergeServers(
      config.servers ?? {},
      sctx.settings.get(NS) as LspSettingsType | undefined,
    );

    if (ctx.get("lsp") === undefined) {
      await ctx.plugin(Lsp);
    }

    if (Object.keys(merged).length > 0) {
      await ctx.plugin(LspStdio, { servers: merged });
      await ctx.plugin(ToolLsp, {});
      ctx.logger.info(`lsp: mounted ${Object.keys(merged).length} LSP server(s)`);
    } else {
      ctx.logger.warn("lsp: no LSP servers configured — run `dsh lsp servers add <id> <command>`");
    }
  });
}
