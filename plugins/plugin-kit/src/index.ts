export type DependencyKind = 'required' | 'optional';

export interface PluginDependency {
  readonly plugin: string;
  readonly kind: DependencyKind;
  readonly reason?: string;
}

export interface FeaturePluginDefinition {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly dependencies?: readonly PluginDependency[];
  readonly provides?: readonly string[];
  readonly profileOnly?: boolean;
}

export interface PluginPackDefinition {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly plugins: readonly string[];
}

export interface StackProfileDefinition {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly packs: readonly string[];
  readonly plugins?: readonly string[];
}

export interface PluginCatalog {
  readonly plugins: readonly FeaturePluginDefinition[];
  readonly packs: readonly PluginPackDefinition[];
  readonly profiles: readonly StackProfileDefinition[];
}

export function definePlugin<const T extends FeaturePluginDefinition>(plugin: T): T {
  return plugin;
}

export function definePack<const T extends PluginPackDefinition>(pack: T): T {
  return pack;
}

export function defineProfile<const T extends StackProfileDefinition>(profile: T): T {
  return profile;
}

export function validateCatalog(catalog: PluginCatalog): void {
  assertUnique(catalog.plugins.map((plugin) => plugin.id), 'plugin id');
  assertUnique(catalog.packs.map((pack) => pack.id), 'pack id');
  assertUnique(catalog.profiles.map((profile) => profile.id), 'profile id');

  const pluginIds = new Set(catalog.plugins.map((plugin) => plugin.id));
  const packIds = new Set(catalog.packs.map((pack) => pack.id));

  for (const plugin of catalog.plugins) {
    assertUnique(
      (plugin.dependencies ?? []).map((dependency) => `${dependency.plugin}:${dependency.kind}`),
      `dependency declaration for ${plugin.id}`,
    );
    assertUnique(plugin.provides ?? [], `capability for ${plugin.id}`);
    for (const dependency of plugin.dependencies ?? []) {
      if (!pluginIds.has(dependency.plugin)) {
        throw new Error(`${plugin.id} references unknown plugin ${dependency.plugin}`);
      }
    }
  }

  for (const pack of catalog.packs) {
    assertUnique(pack.plugins, `plugin in pack ${pack.id}`);
    for (const pluginId of pack.plugins) {
      if (!pluginIds.has(pluginId)) throw new Error(`${pack.id} references unknown plugin ${pluginId}`);
    }
  }

  for (const profile of catalog.profiles) {
    assertUnique(profile.packs, `pack in profile ${profile.id}`);
    assertUnique(profile.plugins ?? [], `direct plugin in profile ${profile.id}`);
    for (const packId of profile.packs) {
      if (!packIds.has(packId)) throw new Error(`${profile.id} references unknown pack ${packId}`);
    }
    for (const pluginId of profile.plugins ?? []) {
      if (!pluginIds.has(pluginId)) throw new Error(`${profile.id} references unknown plugin ${pluginId}`);
    }
  }
}

function assertUnique(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}
