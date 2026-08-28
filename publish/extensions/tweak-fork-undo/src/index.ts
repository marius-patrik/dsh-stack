/**
 * `tweak-fork-undo`: fork-based session undo/redo — the `/undo` `/redo`
 * commands plus their `tweaks-fork-undo` settings section. Split out of the
 * bundled `tweaks` package.
 * @module tweak-fork-undo
 */

import type { Context } from "@deepseek-ai/cordis";
import type z from "@deepseek-ai/schemastery";
import { installLiveSettingsSection } from "@dsh-stack/plugin-kit";
import { installForkUndo } from "./fork-undo.js";
import {
  NS_FORK_UNDO,
  ForkUndoConfig,
  type ForkUndoConfig as ForkUndoConfigType,
} from "./settings.js";

export { NS_FORK_UNDO, ForkUndoConfig } from "./settings.js";
export type { ForkUndoConfig as ForkUndoConfigType } from "./settings.js";
export { forkSession, installForkUndo } from "./fork-undo.js";

export const name = "tweak-fork-undo";
export const inject: string[] = [];

/** The fork-undo extension config: the fork-undo section itself. */
export type Config = ForkUndoConfigType;

export const Config: z<Config> = ForkUndoConfig;

/**
 * Applies the configuration to enable or disable fork undo functionality.
 *
 * Guarantees that fork undo is installed if `config.enabled` is true, and
 * ensures that no changes are made if `config.enabled` is false.
 *
 * @param ctx - The context in which to apply the configuration.
 * @param config - The configuration object determining if fork undo is enabled.
 */
export function apply(ctx: Context, config: Config): void {
  const session: ForkUndoConfigType = { enabled: config?.enabled ?? true };
  installLiveSettingsSection(ctx, NS_FORK_UNDO, ForkUndoConfig, session, undefined, () => {});
  if (session.enabled) void installForkUndo(ctx);
}
