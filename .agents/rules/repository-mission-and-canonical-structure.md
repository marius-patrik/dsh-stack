---
date: 2026-10-13
status: active
---

# Repository mission and canonical structure

Stack publishes independent native DSH plugin implementations and composable bundles inside a single recursive `packages/` source tree. Each native DSH bundle is a directory with its own package manifest and composition patch; nested child bundles and plugin packages may coexist below that directory. DSH owns all profile manifests, state and activation; this repository does not contain any profile templates. No standalone plugin folder or duplicate implementations.

Placement follows ownership in the native bundle graph. `stack.compose` declares dependency edges, and bundle source patches declare Cordis rows. Compile-time generation deterministically flattens native bundle patches; source nesting itself does not activate plugins, and independently owned optional plugins need explicit native activation. Shared DAG nodes have one source, not duplicate source trees.

The native `@dsh-stack/stack` aggregate contains one reusable composition graph. Alternate surface-specific Stack aggregates are forbidden; Headless and TUI are DSH profiles, not competing plugin graphs. DSH alone manages runtime lifecycle, installation, activation, profiles and updates. Stack may not recreate a launcher, profile manager or second runtime loader. The independently maintained Chimney TUI gitlink is `packages/dsh-tui`; DSH's `tui` profile activates its published package directly. `packages/DarkFactory` and `packages/Cognition` are external pinned Git submodules, excluded from the Stack workspace and npm release until their implementations satisfy the native integration contract.

Each package root remains an independent npm workspace, versioned and released with the native DSH contract. Every project command, build verifier and release/discovery process recursively locates package roots by `package.json` and native DSH metadata rather than assuming a fixed folder depth.
