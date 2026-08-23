# Plugin Composition Model

Status: target architecture decision
Date: 2026-08-22

## Decision

DSH Stack does **not** require a custom runtime plugin manager merely to resolve plugin dependencies.

The native DSH/Cordis composition system remains responsible for plugin lifecycle and dependency resolution. Stack adds a higher-level composition layer for reusable plugin packs/bundles and product profiles.

## Responsibilities

### DSH / Cordis

Own:

- plugin lifecycle;
- dependency injection and service availability;
- required dependency resolution;
- optional dependency semantics where supported by DSH;
- plugin activation/disposal;
- runtime service ownership.

### Stack composition

Own:

- plugin manifests as package metadata when useful;
- required and optional plugin relationships expressed in a DSH-compatible way;
- reusable plugin packs/bundles;
- pack composition and nesting;
- profile composition;
- product-specific bundle selection;
- bundle-level configuration/patches;
- capability/catalog metadata;
- installation/distribution metadata.

## Required dependency model

A plugin may declare that another plugin/capability is required.

Semantically:

```text
plugin A
  requires
    plugin/service B
```

A required dependency missing from the composition is a composition/boot error. We do not implement a parallel DAG executor to reproduce this.

Where DSH expresses the dependency through `inject`, service definitions, bundle rows, or another native mechanism, Stack uses that mechanism directly.

## Optional dependency model

A plugin may optionally enhance itself when another plugin/capability exists.

Semantically:

```text
plugin A
  optionally integrates with
    plugin B
```

Optional integration must be capability-tested and must not make B a hard dependency. Plugins should degrade cleanly when the optional capability is absent.

The implementation mechanism must follow DSH's native optional injection/service-availability semantics rather than introducing Stack-global plugin lookup APIs.

## Plugin packs / bundles

A **plugin** is an independently owned runtime capability.

A **plugin pack** is a distributable composition of plugins intended to work together.

A pack may contain:

```text
pack
  ├── plugins
  ├── required packs
  ├── optional packs
  ├── configuration
  ├── profile patches
  └── metadata
```

Packs may depend on other packs. Packs compose recursively into a final DSH profile/bundle graph.

A pack is composition metadata, not a runtime service and not a replacement for Cordis.

## Examples

### Coding pack

```text
coding pack
  ├── agent/preset support
  ├── repository/project capabilities
  ├── editor/filesystem
  ├── terminal/execution
  ├── LSP
  ├── formatter
  ├── planning
  ├── GitHub forge
  └── DarkFactory-derived coding automation
```

### Trading pack

```text
trading pack
  ├── market-data seam
  ├── providers
  ├── indicators
  ├── strategy/backtest
  ├── research/evaluation
  ├── risk analysis
  ├── account model
  └── chart/workspace
```

### SkyBlock pack

```text
skyblock pack
  ├── Hypixel client
  ├── profile/cache
  ├── inventory/museum/economy
  ├── progression/readiness
  ├── pricing/net-worth
  ├── objectives
  └── SkyBlock domain UI/tools/presets
```

### Product profiles

A profile composes packs, plus any direct plugin rows/patches needed for that product.

```text
Stack default
  = core packs + general integrations

Stack coding
  = default/shared packs + coding pack

Stack trading
  = default/shared packs + trading pack

Stack skyblock
  = default/shared packs + skyblock pack
```

## No duplicate manager

The old `plugin-manager` package should not be preserved merely because the existing repository has one.

It is a candidate for deletion unless the final audit identifies a separate, concrete product capability it owns that DSH/Cordis and profile/bundle composition do not provide.

Possible legitimate future management features—such as discovering installed packs, enabling/disabling optional packs, inspecting composition, or editing profile composition—belong to a **composition/configuration surface**, not a second runtime dependency resolver.

## Verification

The final implementation must verify:

- required dependency missing -> deterministic composition/boot failure;
- optional dependency absent -> plugin still boots and behaves correctly;
- optional dependency present -> integration activates;
- nested packs compose without duplicate registration;
- profile composition produces one canonical owner for each capability;
- pack/profile changes produce reproducible composition;
- Web and CLI inspect/use the same composed services;
- no Stack runtime code independently reconstructs DSH's plugin DAG/lifecycle.
