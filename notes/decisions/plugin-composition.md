# Plugin Composition Model

Status: target architecture decision
Date: 2026-08-22

## Decision

DSH Stack does not require a custom runtime plugin manager merely to resolve plugin dependencies. The native DSH/Cordis composition system remains responsible for plugin lifecycle and dependency resolution. Stack adds a higher-level composition layer for reusable plugin packs/bundles and product profiles.

## Responsibilities

### DSH / Cordis

Own plugin lifecycle, dependency injection and service availability, required dependency resolution, optional dependency semantics where supported by DSH, plugin activation/disposal, and runtime service ownership.

### Stack composition

Own plugin manifests as package metadata, required and optional plugin relationships expressed in a DSH-compatible way, reusable plugin packs/bundles, pack composition and nesting, profile composition, product-specific bundle selection, bundle-level configuration/patches, capability/catalog metadata, and installation/distribution metadata.

## Dependency model

A required dependency missing from a composition is a composition/boot error. We do not implement a parallel DAG executor to reproduce this. Optional integrations must be capability-tested and must not make the optional plugin a hard dependency.

## Plugin packs / bundles

A plugin is an independently owned runtime capability. A plugin pack is a distributable composition of plugins intended to work together. Packs compose recursively into a final DSH profile/bundle graph. A pack is composition metadata, not a runtime service and not a replacement for Cordis.

## Product profiles

The default, coding, trading and skyblock profiles compose shared packs plus product-specific packs and direct plugin rows where necessary.

## No duplicate manager

The old `plugin-manager` package should not be preserved merely because the existing repository has one. It is a candidate for deletion unless the final audit identifies a separate concrete product capability that DSH/Cordis and profile/bundle composition do not provide.

## Verification

The final implementation must verify required dependency failures deterministically, optional dependency absence/presence, nested pack composition without duplicate registration, one canonical owner per capability, reproducible profile composition, and no Stack runtime reconstruction of DSH's plugin DAG/lifecycle.
