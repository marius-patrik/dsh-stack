# Profile and plugin architecture

Status: accepted
Date: 2026-08-22

## Profiles

DSH Stack ships multiple first-class product profiles built from the same feature-plugin graph:

- `default`: general-purpose integrated environment
- `coding`: software engineering environment
- `trading`: quantitative trading/research environment
- `skyblock`: Hypixel SkyBlock domain environment

`skyagent` is absorbed into `skyblock`. `darkfactory` is absorbed into `coding`.

Profiles are composition/policy. They do not fork DSH runtime semantics or duplicate core services.

## Feature plugin rule

Every independently usable/composable feature should be its own plugin. The unit is a coherent feature boundary, not an arbitrarily tiny source module.

A plugin may:

- require another plugin;
- optionally depend on another plugin;
- expose services/events/tools/commands/UI surfaces;
- be bundled into one or more packs;
- be independently enabled or disabled.

Runtime dependency resolution remains DSH/Cordis-owned. Stack does not implement a second plugin manager.

## External integration rule

Every external system gets its own integration plugin.

Examples:

- GitHub
- GitHub Projects
- Trello
- GitLab
- Forgejo
- Hypixel
- broker/data vendors
- other SaaS or external APIs

External integration plugins consume shared Stack domain contracts and the common credential/authorization plane. They do not redefine the shared project/task/authentication concepts.

## Packs and profiles

A pack is a reusable composition of feature plugins.
A profile is a product composition of packs, plugins and policy.

```text
feature plugin -> pack/bundle -> profile -> product
```

Packs may contain required and optional integrations. Profiles choose which packs and integrations are active.

## No duplicate implementations

There is exactly one canonical implementation for each substantive feature. Reference projects are absorbed, forked, adapted or retired according to the migration matrix; they are never allowed to create parallel implementations of the same capability.
