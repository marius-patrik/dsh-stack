import { Service, type Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'keybindings'
export const inject = ['slots']
export const optional: string[] = []

export interface KeybindingRule {
  id: string
  label: string
  keys: string
  action: () => void
}

export class KeybindingsService extends Service {
  static inject = ['slots']
  private readonly bindings = new Map<string, KeybindingRule>()

  constructor(ctx: Context) {
    super(ctx, 'keybindings')
  }

  register(rule: KeybindingRule): void {
    if (!rule.id.trim()) throw new Error('Keybinding id must be non-empty')
    this.bindings.set(rule.id, rule)
  }

  get(id: string): KeybindingRule | undefined {
    return this.bindings.get(id)
  }
}

export const Config = Schema.object({})

export function apply(ctx: Context): void {
  new KeybindingsService(ctx)
}
