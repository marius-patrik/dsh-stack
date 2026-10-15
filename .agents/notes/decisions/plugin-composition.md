# Native plugin and bundle composition

Status: active

## Authority

DeepSeek Harness is the sole authority for profiles, package installation,
runtime lifecycle, service injection, and activation. Stack implements native
plugins and declares native DSH bundle patches; it does not manage profiles.

## Source graph

`packages/stack/` contains nested bundle and plugin npm packages.
Each native bundle declares `dsh.bundle.patch` in its manifest. Its
`stack.compose` edges name child bundles and their required package
dependencies. The build generator resolves the graph, deduplicates shared
children and emits native Cordis patch rows. Source-directory nesting does
not implicitly activate a package.

The published `@dsh-stack/stack` aggregate exposes one composition graph
to compatible Web, Headless and TUI DSH profiles. Surface differences
belong to DSH's native profile/environment, not alternate Stack graphs.

## Contract

- Every runtime capability and client state service has one owner.
- Required dependencies fail deterministically when absent.
- Optional integrations check capabilities and report unavailability.
- Multiple patch layers cannot register conflicting row IDs or silently
  ignore an intended target.
- All external operations and UI slots use actual native DSH interfaces.

## Verification

Build-time bundle generation verifies the dependency graph, cycles and
duplicate patch IDs. Integration checks must verify a fresh native DSH install,
resolved configuration and behavioral surface compatibility. See #340.
