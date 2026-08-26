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

/** resolveProfile implementation. */
export function resolveProfile(
  catalog: CompositionCatalog,
  profileId: string,
): ResolvedComposition {
  const profile = catalog.profiles.get(profileId);
  if (!profile) throw new Error(`Unknown Stack profile: ${profileId}`);

  const selectedPackIds = new Set(profile.packs);
  const packs: PackDefinition[] = [];
  const selectedPluginIds = new Set(profile.plugins ?? []);

  for (const packId of selectedPackIds) {
    const pack = catalog.packs.get(packId);
    if (!pack) throw new Error(`Profile ${profileId} references unknown pack ${packId}`);
    packs.push(pack);
    for (const pluginId of pack.plugins) selectedPluginIds.add(pluginId);
  }

  const plugins = resolvePluginClosure(catalog.plugins, selectedPluginIds);
  return { profile, packs, plugins };
}

/** resolvePluginClosure implementation. */
function resolvePluginClosure(
  registry: ReadonlyMap<string, PluginDefinition>,
  selected: ReadonlySet<string>,
): PluginDefinition[] {
  const resolved = new Map<string, PluginDefinition>();
  const visiting = new Set<string>();

  const /** visit implementation. */
    visit = (pluginId: string): void => {
      if (resolved.has(pluginId)) return;
      if (visiting.has(pluginId))
        throw new Error(`Plugin dependency cycle detected at ${pluginId}`);

      const plugin = registry.get(pluginId);
      if (!plugin) throw new Error(`Composition references unknown plugin ${pluginId}`);

      visiting.add(pluginId);
      for (const dependency of plugin.dependencies ?? []) {
        if (dependency.kind === "required") visit(dependency.plugin);
      }
      visiting.delete(pluginId);
      resolved.set(pluginId, plugin);
    };

  for (const pluginId of selected) visit(pluginId);

  for (const plugin of resolved.values()) {
    for (const dependency of plugin.dependencies ?? []) {
      if (dependency.kind === "optional" && !registry.has(dependency.plugin)) {
        throw new Error(
          `Plugin ${plugin.id} declares optional dependency ${dependency.plugin}, but it is unknown`,
        );
      }
    }
  }

  return [...resolved.values()];
}
