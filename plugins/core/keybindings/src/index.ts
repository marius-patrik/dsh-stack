import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'keybindings';
export const inject = ['slots'];
export const optional: string[] = [];

export interface KeybindingRule {
  id: string;
  label: string;
  keys: string;
  action: () => void;
}

export class KeybindingsService {
  private bindings = new Map<string, KeybindingRule>();

  register(rule: KeybindingRule): void {
    this.bindings.set(rule.id, rule);
  }

  get(id: string): KeybindingRule | undefined {
    return this.bindings.get(id);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).keybindings = new KeybindingsService();
}
