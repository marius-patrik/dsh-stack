import { Service, type Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "integrations-registry";
export const inject = ["webServer", "slots"];
export const optional = ["icons"];

export interface IntegrationEntry {
  id: string;
  name: string;
  category: "sandbox" | "editor" | "tool" | "vcs" | "runtime" | "network";
  installed: boolean;
  status: "online" | "standby" | "error";
  version?: string;
}

export class IntegrationsRegistryService extends Service {
  static inject = ["webServer", "slots"];
  static optional = ["icons"];
  private readonly registry = new Map<string, IntegrationEntry>();

  /** Constructs an instance. */
  constructor(ctx: Context) {
    super(ctx, "integrations");
  }

  /** register implementation. */
  register(entry: IntegrationEntry): void {
    if (!entry.id.trim()) throw new Error("Integration id must be non-empty");
    this.registry.set(entry.id, { ...entry });
  }

  /** get implementation. */
  get(id: string): IntegrationEntry | undefined {
    return this.registry.get(id);
  }

  /** all implementation. */
  all(): IntegrationEntry[] {
    return Array.from(this.registry.values(), (entry) => ({ ...entry }));
  }
}

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context): void {
  new IntegrationsRegistryService(ctx);
}
