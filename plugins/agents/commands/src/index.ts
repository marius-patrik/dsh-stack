import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'commands';
export const inject = ['slots', 'sessions', 'actions'];
export const optional: string[] = [];

export interface SlashCommand {
  name: string;
  description: string;
  execute: (args: string) => Promise<any> | any;
}

export class CommandsService {
  private commands = new Map<string, SlashCommand>();

  register(cmd: SlashCommand): void {
    this.commands.set(cmd.name, cmd);
  }

  list(): SlashCommand[] {
    return Array.from(this.commands.values());
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).commands = new CommandsService();
}
