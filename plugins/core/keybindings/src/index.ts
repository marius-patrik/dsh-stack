import { Service, type Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "keybindings";
export const inject = ["slots"];
export const optional: string[] = [];

export interface KeybindingRule {
  id: string;
  label: string;
  keys: string;
  action: () => void;
}

export class KeybindingsService extends Service {
  static inject = ["slots"];
  private readonly bindings = new Map<string, KeybindingRule>();

    /** Constructs an instance. */
constructor(ctx: Context) {
    super(ctx, "keybindings");
  }

    /** register implementation. */
register(rule: KeybindingRule): void {
    if (!rule.id.trim()) throw new Error("Keybinding id must be non-empty");
    this.bindings.set(rule.id, rule);
  }

    /** get implementation. */
get(id: string): KeybindingRule | undefined {
    return this.bindings.get(id);
  }
}

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context): void {
  new KeybindingsService(ctx);
}
