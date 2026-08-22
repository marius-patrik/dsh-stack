export type DependencyKind = "required" | "optional";

export interface PluginDependency {
  readonly plugin: string;
  readonly kind: DependencyKind;
  readonly reason?: string;
}

export interface PluginDefinition {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly dependencies?: readonly PluginDependency[];
  readonly provides?: readonly string[];
}

export interface PackDefinition {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly plugins: readonly string[];
}

export interface ProfileDefinition {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly packs: readonly string[];
  readonly plugins?: readonly string[];
}
