# Closure verification

This document records the final repository-level verification pass for the Stack reorganization.

The canonical workspace is recursive under `packages/**`. Aggregate domain roots are metadata-only pack descriptors; independently usable features remain individual plugins. Checked-in generated `lib/` output is prohibited; build output is created only in CI/worktrees. DSH/Cordis remains the runtime plugin/dependency authority.

The `ci/closure-verification` branch exists solely to exercise the full pull-request CI workflow against the reorganized tree before merging the verification commit back to `main`.
