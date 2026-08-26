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

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const session: ForkUndoConfigType = { enabled: config?.enabled ?? true };
  installLiveSettingsSection(ctx, NS_FORK_UNDO, ForkUndoConfig, session, undefined, () => {});
  if (session.enabled) void installForkUndo(ctx);
}
