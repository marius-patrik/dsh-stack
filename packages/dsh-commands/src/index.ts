import { Service, type Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'commands'
export const inject = ['slots', 'sessions', 'actions']
export const optional: string[] = []

export interface SlashCommand {
  name: string
  description: string
  execute: (args: string) => Promise<unknown> | unknown
}

export class CommandsService extends Service {
  static inject = ['slots', 'sessions', 'actions']
  private readonly commands = new Map<string, SlashCommand>()

  constructor(ctx: Context) {
    super(ctx, 'commands')
  }

  register(cmd: SlashCommand): void {
    if (!cmd.name.trim()) throw new Error('Slash command name must be non-empty')
    this.commands.set(cmd.name, cmd)
  }

  list(): SlashCommand[] {
    return Array.from(this.commands.values())
  }
}

export const Config = Schema.object({})

export function apply(ctx: Context): void {
  new CommandsService(ctx)
}
