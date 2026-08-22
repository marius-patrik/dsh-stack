import type { PackDefinition, PluginDefinition, ProfileDefinition } from "./types.js";

export interface CompositionCatalog {
  readonly plugins: ReadonlyMap<string, PluginDefinition>;
  readonly packs: ReadonlyMap<string, PackDefinition>;
  readonly profiles: ReadonlyMap<string, ProfileDefinition>;
}

export interface ResolvedComposition {
  readonly profile: ProfileDefinition;
  readonly packs: readonly PackDefinition[];
  readonly plugins: readonly PluginDefinition[];
}

export function resolveProfile(catalog: CompositionCatalog, profileId: string): ResolvedComposition {
  const profile = catalog.profiles.get(profileId);
  if (!profile) throw new Error(`Unknown Stack profile: ${profileId}`);

  const packIds = new Set(profile.packs);
  const pluginIds = new Set(profile.plugins ?? []);
  const packs: PackDefinition[] = [];

  for (const packId of packIds) {
    const pack = catalog.packs.get(packId);
    if (!pack) throw new Error(`Profile ${profileId} references unknown pack ${packId}`);
    packs.push(pack);
    for (const pluginId of pack.plugins) pluginIds.add(pluginId);
  }

  const plugins: PluginDefinition[] = [];
  for (const pluginId of pluginIds) {
    const plugin = catalog.plugins.get(pluginId);
    if (!plugin) throw new Error(`Composition references unknown plugin ${pluginId}`);
    plugins.push(plugin);
  }

  validateRequiredDependencies(catalog.plugins, plugins);
  return { profile, packs, plugins };
}

function validateRequiredDependencies(
  registry: ReadonlyMap<string, PluginDefinition>,
  plugins: readonly PluginDefinition[],
): void {
  const selected = new Set(plugins.map((plugin) => plugin.id));

  for (const plugin of plugins) {
    for (const dependency of plugin.dependencies ?? []) {
      if (dependency.kind !== "required") continue;
      if (!registry.has(dependency.plugin)) {
        throw new Error(`Plugin ${plugin.id} requires unknown plugin ${dependency.plugin}`);
      }
      if (!selected.has(dependency.plugin)) {
        throw new Error(`Plugin ${plugin.id} requires ${dependency.plugin}, but it is not selected`);
      }
    }
  }
}
