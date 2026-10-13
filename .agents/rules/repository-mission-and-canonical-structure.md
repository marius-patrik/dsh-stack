---
date: 2026-10-11
status: active
---

# Repository mission and canonical structure

The source of truth is a single recursive composition tree under `plugins/<name>/`, native DSH bundles within `bundles/**/`, and native profile templates within `profiles/<name>/`. Bundle and plugin package roots may nest; every package manifest defines an independent workspace. There is no `bundles/packs/` directory or fixed composition depth.

Runtime, native profiles, package installation, updates, plugin activation, and CLI are owned by upstream DSH; Stack builds and publishes native package artifacts, and may not create its own installer, updater, profile manager, legacy launcher, or separate pinned DSH checkout.

Native bundle parent package dependencies declare child bundles. At build time `scripts/generate-bundles.mjs` traverses and deduplicates the dependency DAG, assembles ordered `dsh.bundle.patch` files, and rejects cycles and duplicate inserted Cordis rows. At runtime DSH sees an ordinary bundle, with no special recursive bundle loader.

`profiles/` entries are actual `dsh.profile` manifest and `cordis.patch.yml` templates, not npm package aliases. Profiles may contain DSH application base bundles and the selected Stack bundle; users control optional activation and personal overrides directly via DSH.

`_migrate/Memory` is staged external source and `_migrate/` is migration-only. `CONTRIBUTING.md` links to `.agents/AGENTS.md`, with no root `AGENTS.md`, `CLAUDE.md`, or `DSH/` gitlink.

No duplicate implementation tree, transitional production path, stale compatibility adapter, or parallel feature owner is allowed.
