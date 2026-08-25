/**
 * `dsh-tweaks`: the user-facing harness tweaks surface. v1 registered the
 * `dsh-tweaks` settings namespace (homeRoot, command) and mirrored it into
 * every agent home's settings document. v2 adds the backlog's session-UX
 * features by wiring the harness seams the roadmap calls out:
 *
 * - share links: a self-hosted read-only `<basePath>/<id>` route (interactive
 *   mode token-gated, opt-in);
 * - observability: the `dsh stats` / `dsh sessions` verbs read the harness
 *   projection cache (no server round-trip needed);
 * - session UX: `/plan` toggle (plan-mode seam), `/undo` `/redo` (fork-based),
 *   drag-drop images (attachment seam), config-file slash commands, and a
 *   keybind settings surface.
 * @module dsh-tweaks
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
import {
  NS,
  NS_COMMANDS,
  NS_KEYBINDS,
  NS_SESSION,
  NS_SHARE,
  NS_STATS,
  CommandsConfig,
  KeybindsConfig,
  SessionUxConfig,
  ShareConfig,
  StatsConfig,
  type CommandsConfig as CommandsConfigType,
  type KeybindsConfig as KeybindsConfigType,
  type SessionUxConfig as SessionUxConfigType,
  type ShareConfig as ShareConfigType,
  type StatsConfig as StatsConfigType,
} from "./settings.js";
import { mountShareRoute } from "./share.js";
import {
  installForkUndo,
  installPlanToggle,
  validateCommand,
  validateKeybinds,
} from "./session.js";

export {
  normalizeSection,
  readTweaksSection,
  sectionsEqual,
  writeTweaksSection,
} from "./mirror.js";
export type { TweaksSection } from "./mirror.js";
export type * from "./settings.js";

export const name = "dsh-tweaks";
export const inject: string[] = [];

const DEFAULT_HOME = join(homedir(), ".agents");

/** The agent home this run boots under. */
export function resolveHome(): string {
  return resolve(process.env["DSH_HOME"] ?? DEFAULT_HOME);
}

/** The full v2 config: the original tweaks plus every feature section. */
export interface Config extends TweaksSection {
  share?: ShareConfigType;
  stats?: StatsConfigType;
  session?: SessionUxConfigType;
  commands?: CommandsConfigType;
  keybinds?: KeybindsConfigType;
}

export const Config: z<Config> = z.object({
  homeRoot: z.string(),
  command: z.string(),
  share: ShareConfig,
  stats: StatsConfig,
  session: SessionUxConfig,
  commands: CommandsConfig,
  keybinds: KeybindsConfig,
});

/**
 * Mirror the effective `dsh-tweaks` (homeRoot/command) section into the
 * settings document of every agent home (see `mirror.ts`). The launcher reads
 * only this top-level section; the v2 sections live under `dsh-tweaks.*`
 * namespaces the web Settings UI edits directly.
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
        log.warn(`dsh-tweaks: could not mirror settings to ${path}`);
        log.warn(error);
      }
    }),
  ).then(() => undefined);
}

/** One settings-section installation (share/stats/session/commands/keybinds). */
function installSection<T>(
  ctx: Context,
  ns: ReturnType<typeof settingsNamespace>,
  schema: z<T>,
  entry: T,
  validate: ((value: T) => void) | undefined,
  onChange: () => void,
): void {
  installSettingsSection(ctx, ns, schema, entry, {
    setSource: () => {
      /* sections are read live through their source thunks */
    },
    onChange,
    ...(validate === undefined ? {} : { validate }),
  });
}

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const currentHome = resolveHome();
  let   /** current implementation. */
current: () => Config = () => config;
  const   /** mirror implementation. */
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
  // The web profile disables ui-settings-general (dsh-tweaks took over the settings
  // surface), but ui-settings-models still writes welcomeNoticeVersion through
  // the settings API. Without this registration, settings.mutate fails silently.
  ctx.inject(["settings"], (settingsCtx) => {
    settingsCtx.settings.register(
      settingsNamespace("ui-onboarding"),
      z.object({ welcomeNoticeVersion: z.string() }),
    );
  });

  // v2: sections default to their schema defaults when the composition entry
  // does not spell them out (the web profile composes dsh-tweaks bare).
  const share: ShareConfigType = {
    enabled: config.share?.enabled ?? true,
    allowInteractive: config.share?.allowInteractive ?? false,
    advertisedHost: config.share?.advertisedHost ?? "",
    basePath: config.share?.basePath ?? "/share",
  };
  const stats: StatsConfigType = {
    enabled: config.stats?.enabled ?? true,
    format: config.stats?.format ?? "table",
  };
  const session: SessionUxConfigType = {
    planToggle: config.session?.planToggle ?? true,
    forkUndo: config.session?.forkUndo ?? true,
    dragDropImages: config.session?.dragDropImages ?? true,
    maxImageBytes: config.session?.maxImageBytes ?? 8 * 1024 * 1024,
  };
  const commands: CommandsConfigType = {
    enabled: config.commands?.enabled ?? true,
    commands: config.commands?.commands ?? [],
  };
  const keybinds: KeybindsConfigType = {
    enabled: config.keybinds?.enabled ?? true,
    keymap: config.keybinds?.keymap ?? [],
  };

  // v2: share links (read-only route on the harness web server).
  installSection(ctx, NS_SHARE, ShareConfig, share, undefined, () => {});
  mountShareRoute(ctx, currentHome, share);

  // v2: observability settings surface (the CLI verbs read the projection
  // cache directly; no server wiring needed).
  installSection(ctx, NS_STATS, StatsConfig, stats, undefined, () => {});

  // v2: session UX.
  installSection(ctx, NS_SESSION, SessionUxConfig, session, undefined, () => {});
  if (session.planToggle) void installPlanToggle(ctx);
  if (session.forkUndo) void installForkUndo(ctx);

  // v2: config-file slash commands (programmatic bridge into the registry).
  installSection(
    ctx,
    NS_COMMANDS,
    CommandsConfig,
    commands,
    (value) => {
      for (const command of value.commands) validateCommand(command);
    },
    () => {
      installConfiguredCommands(ctx, commands);
    },
  );

  // v2: keybind settings surface (greenfield; consumed by the client).
  installSection(
    ctx,
    NS_KEYBINDS,
    KeybindsConfig,
    keybinds,
    (value) => {
      validateKeybinds(value.keymap);
    },
    () => {},
  );
}

/** Track the live config-command registrations so re-installs dispose first. */
let configuredCommandsDispose: (() => void) | undefined;

/** Register each config-file command through the harness command registry. */
function installConfiguredCommands(ctx: Context, commands: CommandsConfigType): void {
  configuredCommandsDispose?.();
  configuredCommandsDispose = undefined;
  if (!commands.enabled) return;
  ctx.inject(["commands"], (commandCtx) => {
    const disposers: (() => void)[] = [];
    for (const entry of commands.commands) {
      const reply = entry.reply;
      disposers.push(
        commandCtx.commands.register({
          name: entry.name,
          description: entry.description,
          handler: () => ({ kind: "success" as const, text: reply }),
        }),
      );
    }
    configuredCommandsDispose = () => {
      for (const dispose of disposers) dispose();
    };
    return configuredCommandsDispose;
  });
}
