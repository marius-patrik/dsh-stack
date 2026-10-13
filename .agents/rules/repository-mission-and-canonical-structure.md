---
date: 2026-10-13
status: active
---

# Repository mission and canonical structure

Stack publishes independent native DSH plugin implementations and composable bundles inside a single recursive `plugins/` source tree. Each native DSH bundle is a directory with its own package manifest and composition patch; nested child bundles and plugin packages may coexist below that directory. The root `profiles/<profile>/` directory contains separately managed native DSH profile templates, not workspace packages. No standalone plugin folder or duplicate implementations.

Placement follows ownership in the native bundle graph. `stack.compose` declares dependency edges, and bundle source patches declare Cordis rows. Compile-time generation deterministically flattens native bundle patches; source nesting itself does not activate plugins, and independently owned optional plugins need explicit native activation. Shared DAG nodes have one source, not duplicate source trees.

DSH alone manages runtime lifecycle, installation, activation, profiles and updates. Stack may not recreate a launcher, profile manager or second runtime loader. The independently maintained Chimney TUI gitlink is `plugins/headless/dsh-tui`; DSH's `tui` profile activates its published package directly. `_migrate/` holds non-installed external migration sources.

Each package root remains an independent npm workspace, versioned and released with the native DSH contract. Every project command, build verifier and release/discovery process recursively locates package roots by `package.json` and native DSH metadata rather than assuming a fixed folder depth.
