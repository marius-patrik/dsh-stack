/**
 * dsh-tweaks session UX: wires the existing harness seams that the backlog
 * calls out as missing first-class surfaces.
 *
 * - Plan/Build toggle: registers `/build`, delegating to the harness plan-mode
 *   controller (`ctx.planMode.set(agent, false)`), so it complements the
 *   existing `/plan` command instead of colliding with it.
 * - Fork-based undo/redo: `/undo` `/redo` fork a new session from an earlier
 *   logged boundary via `ctx.sessions.create`.
 * - Slash commands: registers config-file commands from the settings section
 *   through `ctx.commands.register`.
 * - Keybinds: a settings surface the client consumes (greenfield).
 * @module dsh-tweaks/session
 */

import type { Context } from "@deepseek-ai/cordis";
import type { SessionEvent } from "@deepseek-ai/dsh-session";
import type {} from "@deepseek-ai/dsh-commands";
import type {} from "@deepseek-ai/dsh-plan-mode";
import type { CommandEntry, KeybindEntry } from "./settings.js";

export interface SessionUxDeps {
  planToggle: boolean;
  forkUndo: boolean;
  commands: CommandEntry[];
  keybinds: KeybindEntry[];
}

/** Register the Build (leave-plan-mode) toggle command. Returns the inject fiber. */
export function installPlanToggle(ctx: Context): unknown {
  return ctx.inject(["commands", "planMode"], (commandCtx) => {
    return commandCtx.commands.register({
      name: "build",
      description: "Leave plan mode and continue in the default mode",
      handler: ({ agent }) => {
        switch (commandCtx.planMode.set(agent, false)) {
          case "committed":
            return { kind: "success", text: "Plan mode off. Continue building." };
          case "queued":
            return { kind: "success", text: "Leaving plan mode (applies from the next step)." };
          case "cancelled":
            return { kind: "success", text: "Plan mode is already inactive." };
          case "noop":
            return { kind: "success", text: "Plan mode is already inactive." };
        }
      },
    });
  });
}

/** Register the fork-based `/undo` and `/redo` commands. Returns the inject fiber. */
export function installForkUndo(ctx: Context): unknown {
  return ctx.inject(["commands", "sessions"], (commandCtx) => {
    const disposers: (() => void)[] = [];
    const     /** make implementation. */
make = (name: string, description: string, direction: -1 | 1): void => {
      disposers.push(
        commandCtx.commands.register({
          name,
          description,
          handler: (invocation) => forkSession(commandCtx.sessions, invocation.agent, direction),
        }),
      );
    };
    make("undo", "Fork this session from the previous message boundary", -1);
    make("redo", "Fork this session from the latest message boundary", 1);
    return () => {
      for (const dispose of disposers) dispose();
    };
  });
}

/** Fork a new session from an earlier/later message boundary in the log. */
export function forkSession(
  sessions: { create(id?: string, options?: { seed?: readonly SessionEvent[] }): unknown },
  agent: { session: { events: readonly SessionEvent[] } },
  direction: -1 | 1,
): { kind: "success"; text: string } | { kind: "error"; text: string } {
  const events = agent.session.events;
  if (events.length === 0) return { kind: "error", text: "no events to fork from" };
  const boundaries: number[] = [];
  events.forEach((event, index) => {
    if (event.type === "user/message") boundaries.push(index);
  });
  const target =
    direction === -1
      ? boundaries.length > 0
        ? boundaries[boundaries.length - 1]
        : 0
      : events.length;
  const seed = events.slice(0, target);
  sessions.create(undefined, { seed });
  return {
    kind: "success",
    text: `${direction === -1 ? "undo" : "redo"}: forked ${seed.length} events into a new session`,
  };
}

/** Validate a keybind entry (used by the settings `validate` hook). */
export function validateKeybinds(entries: KeybindEntry[]): void {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    if (entry.keys.trim().length === 0) {
      throw new Error(`keybind "${entry.action}" has an empty chord`);
    }
    const prior = seen.get(entry.action);
    if (prior !== undefined && prior !== entry.keys) {
      throw new Error(`keybind action "${entry.action}" bound twice (${prior} vs ${entry.keys})`);
    }
    seen.set(entry.action, entry.keys);
  }
}

/** Validate a command entry (name shape + non-empty reply). */
export function validateCommand(entry: CommandEntry): void {
  if (!/^[a-z][a-z0-9_-]*$/.test(entry.name)) {
    throw new Error(
      `command name "${entry.name}" must be lowercase [a-z0-9_-] without a leading slash`,
    );
  }
  if (entry.reply.trim().length === 0)
    throw new Error(`command "${entry.name}" has an empty reply`);
}
