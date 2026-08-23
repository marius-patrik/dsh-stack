/**
 * `lsp`: owns the LSP capability on the web profile. The harness ships the
 * LSP service definition (`ctx.lsp`), a generic stdio provider
 * (`dsh-lsp-stdio`), and a model-facing `lsp` tool (`dsh-tool-lsp`) — but
 * composes none of them by default, and its LSP operation set is a closed
 * compile-time union (no formatting: that is the formatter package's job).
 * This plugin mounts the trio through `ctx.plugin` and feeds the stdio provider
 * the server table from the LSP settings section.
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

export function mergeServers(
  entry: LspConfig["servers"],
  live: LspSettingsType | undefined,
): Record<string, LspSettingsType["servers"][string]> {
  return { ...(entry ?? {}), ...(live?.servers ?? {}) };
}

export function apply(ctx: Context, config: LspConfig): void {
  installSettingsSection(
    ctx,
    NS,
    LspSettings,
    { servers: {} },
    { setSource: () => {}, onChange: () => {} },
  );

  ctx.inject(["settings"], async (sctx) => {
    const merged = mergeServers(
      config.servers ?? {},
      sctx.settings.get(NS) as LspSettingsType | undefined,
    );

    if (ctx.get("lsp") === undefined) await ctx.plugin(Lsp);

    if (Object.keys(merged).length > 0) {
      await ctx.plugin(LspStdio, { servers: merged });
      await ctx.plugin(ToolLsp, {});
      ctx.logger.info(`lsp: mounted ${Object.keys(merged).length} LSP server(s)`);
    } else {
      ctx.logger.warn("lsp: no LSP servers configured");
    }
  });
}
