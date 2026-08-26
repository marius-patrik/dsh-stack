/**
 * `tweaks`: the user-facing harness tweaks surface — the `tweaks` settings
 * namespace (homeRoot/command) registrar and its mirror into every agent
 * home's settings document. The session-UX features that v1 bundled here now
 * live in dedicated extensions plugging into this surface:
 * `tweak-share-links`, `tweak-stats`, `tweak-plan-toggle`, `tweak-fork-undo`,
 * `tweak-drag-drop`, `tweak-slash-commands`, and `tweak-keybinds`.
 * @module tweaks
 */

import type { Context } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import {
  normalizeSection,
  readTweaksSection,
  sectionsEqual,
  writeTweaksSection,
} from "./mirror.js";
import type { TweaksSection } from "./mirror.js";
import { NS } from "./settings.js";

export {
  normalizeSection,
  readTweaksSection,
  sectionsEqual,
  writeTweaksSection,
} from "./mirror.js";
export type { TweaksSection } from "./mirror.js";
export { NS } from "./settings.js";

export const name = "tweaks";
export const inject: string[] = [];

const DEFAULT_HOME = join(homedir(), ".agents");

/** The agent home this run boots under. */
export function resolveHome(): string {
  return resolve(process.env["DSH_HOME"] ?? DEFAULT_HOME);
}

/** The tweaks config: the homeRoot/command mirror section. */
export type Config = TweaksSection;

export const Config: z<Config> = z.object({
  homeRoot: z.string(),
  command: z.string(),
});

/**
 * Mirror the effective `tweaks` (homeRoot/command) section into the
 * settings document of every agent home (see `mirror.ts`). The launcher reads
 * only this top-level section; the tweak extension sections live under their
 * own namespaces the web Settings UI edits directly.
 */
export function mirrorTweaks(
  currentHome: string,
  section: () => Config,
  log: Pick<Context["logger"], "warn">,
): Promise<void> {
  const effective = normalizeSection(section());
  if (Object.keys(effective).length === 0) return Promise.resolve();
  const targets = new Set<string>([currentHome, DEFAULT_HOME]);
  return Promise.all(
    [...targets].map(async (home) => {
      const path = join(home, "settings.yaml");
      try {
        const existing = await readTweaksSection(path);
        if (sectionsEqual(existing, effective)) return;
        await writeTweaksSection(path, effective);
      } catch (error) {
        log.warn(`tweaks: could not mirror settings to ${path}`);
        log.warn(error);
      }
    }),
  ).then(() => undefined);
}

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const currentHome = resolveHome();
  let /** current implementation. */ current: () => Config = () => config;
  const /** mirror implementation. */
    mirror = (): void => {
      void mirrorTweaks(currentHome, current, ctx.logger);
    };
  // The launcher reads settings.yaml before this process exists, so the first
  // mirror must run even when no settings provider is mounted: it bootstrap
  // the document for the next launch.
  mirror();
  installSettingsSection(ctx, NS, Config, config, {
    setSource: (source) => {
      current = source;
    },
    onChange: mirror,
  });

  // Register the ui-onboarding namespace that ui-settings-general used to own.
  // The web profile disables ui-settings-general (tweaks took over the settings
  // surface), but ui-settings-models still writes welcomeNoticeVersion through
  // the settings API. Without this registration, settings.mutate fails silently.
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace("ui-onboarding"),
      z.object({ welcomeNoticeVersion: z.string() }),
    );
  });
}
