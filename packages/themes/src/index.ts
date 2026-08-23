/**
 * `dsh-themes`: VS Code/TextMate theme support for the dsh web UI. The node
 * half owns the installed theme store (files under the agent home), a
 * `/themes.json` route the browser half registers from, the Open VSX catalog
 * seam (search/download), and the `dsh theme` CLI verbs. The browser half
 * (`client.js`, a hand-authored `__ModuleLoader__` bundle) fetches the route
 * and feeds each installed theme into the harness `ctx.theme` registry, then
 * applies the stored active choice.
 *
 * The registry surface accepts only the semantic `--dsw-alias-*` token layer,
 * so every installed source is mapped to that vocabulary at install time (see
 * `theme.ts`) — the browser never parses VS Code color keys.
 * @module dsh-themes
 */

import type { Context } from "@deepseek-ai/cordis";
import type { IncomingMessage, ServerResponse } from "node:http";
import z from "@deepseek-ai/schemastery";
import type {} from "@deepseek-ai/dsh-host-webserver";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { mapTheme, type ThemeSource } from "./theme.js";
import { mountThemeWeb } from "./web.js";
import { listThemes, resolveStoreDir, saveTheme, storeHandle, type StoredTheme } from "./store.js";
import {
  DEFAULT_CATALOG_URL,
  DEFAULT_THEMES_DIR,
  NS,
  ThemesConfig,
  ThemesSettings,
  type ThemesConfig as ThemesConfigType,
} from "./settings.js";

export type * from "./theme.js";
export type * from "./store.js";
export type * from "./settings.js";
export {
  ALIAS_TOKENS,
  mapTheme,
  normalizeColor,
  parseTmThemeXml,
  parseVsCodeTheme,
  themeId,
} from "./theme.js";
export { listThemes, removeTheme, resolveStoreDir, saveTheme, storeHandle } from "./store.js";
export {
  searchCatalog,
  extractThemesFromVsix,
  resolveCatalogExtension,
  downloadVsix,
} from "./catalog.js";
export type { CatalogExtension } from "./catalog.js";
export { mountThemeWeb, THEMES_API_PREFIX } from "./web.js";
export type { ThemeWebDeps } from "./web.js";

export const name = "dsh-themes";
export const inject: string[] = [];
const DEFAULT_HOME_DIR = join(".agents") as string;

export function resolveHome(): string {
  return resolve(process.env["DSH_HOME"] ?? join(homedir(), DEFAULT_HOME_DIR));
}

export const Config: z<ThemesConfig> = ThemesConfig;
export const THEMES_ROUTE = "/themes.json";

export interface InstallThemeOptions {
  id?: string;
  extension?: string;
}

export async function installThemeSource(
  home: string,
  root: string,
  source: ThemeSource,
  options: InstallThemeOptions = {},
): Promise<StoredTheme> {
  const handle = storeHandle(home, root);
  const definition = mapTheme(source, options.id);
  const stored: StoredTheme = {
    ...definition,
    name: source.name,
    ...(options.extension === undefined ? {} : { extension: options.extension }),
  };
  await saveTheme(handle, stored);
  return stored;
}

export async function installVsix(
  home: string,
  root: string,
  vsixPath: string,
): Promise<StoredTheme[]> {
  const { extractThemesFromVsix } = await import("./catalog.js");
  const sources = await extractThemesFromVsix(vsixPath);
  const stored: StoredTheme[] = [];
  for (const source of sources) stored.push(await installThemeSource(home, root, source));
  return stored;
}

export async function listInstalled(home: string, root: string): Promise<StoredTheme[]> {
  return listThemes(storeHandle(home, root));
}

function activeThemeId(ctx: Context): string {
  const settings = ctx.get("settings");
  if (settings === undefined) return "";
  const section = settings.get(NS) as ThemesSettings | undefined;
  return section?.active ?? "";
}

export function apply(ctx: Context, config: ThemesConfigType): void {
  const root = config.root ?? DEFAULT_THEMES_DIR;
  const catalogUrl = config.catalogUrl ?? DEFAULT_CATALOG_URL;
  let writer: ((id: string) => Promise<void>) | undefined;
  ctx.inject(["settings"], (settingsCtx) => {
    const scope = settingsCtx.settings.register(NS, ThemesSettings, { base: { active: "" } });
    settingsCtx.effect(() => {
      writer = (id) => scope.update({ active: id });
      return () => {
        writer = undefined;
      };
    }, "dsh-themes: active-theme writer");
  });

  mountThemeWeb(ctx, {
    home: resolveHome,
    root,
    catalogUrl,
    active: () => activeThemeId(ctx),
    setActive: async (id) => {
      if (writer === undefined) throw new Error("dsh-themes: no settings service is mounted");
      await writer(id);
    },
  });

  ctx.inject(["webServer"], (webCtx) => {
    webCtx.effect(
      () =>
        webCtx.webServer.register({
          kind: "exact",
          path: THEMES_ROUTE,
          handler: async (_req: IncomingMessage, res: ServerResponse) => {
            const home = resolveHome();
            const themes = await listInstalled(home, root);
            const body = JSON.stringify({
              active: activeThemeId(webCtx),
              root,
              catalogUrl,
              themes,
            });
            res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
            res.end(body);
          },
        }),
      "dsh-themes: themes route",
    );
  });
}
