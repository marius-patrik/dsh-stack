/**
 * `tweak-slash-commands`: config-file slash commands — the `tweaks-commands`
 * settings section bridged into the harness command registry. Split out of
 * the bundled `tweaks` package.
 * @module tweak-slash-commands
 */

import type { Context } from "@deepseek-ai/cordis";
import type z from "@deepseek-ai/schemastery";
import { installLiveSettingsSection } from "@dsh-stack/plugin-kit";
import { installConfiguredCommands, validateCommand } from "./commands.js";
import {
  NS_COMMANDS,
  CommandsConfig,
  type CommandsConfig as CommandsConfigType,
} from "./settings.js";

export { NS_COMMANDS, CommandEntry, CommandsConfig } from "./settings.js";
export type {
  CommandEntry as CommandEntryType,
  CommandsConfig as CommandsConfigType,
} from "./settings.js";
export { installConfiguredCommands, validateCommand } from "./commands.js";

export const name = "tweak-slash-commands";
export const inject: string[] = [];

/** The slash-commands extension config: the commands section itself. */
export type Config = CommandsConfigType;

export const Config: z<Config> = CommandsConfig;

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const commands: CommandsConfigType = {
    enabled: config?.enabled ?? true,
    commands: config?.commands ?? [],
  };
  installLiveSettingsSection(
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
}
