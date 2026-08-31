# Client state sharing across bundles

Status: architecture directive

## Problem

`src/scripts/client-runtime/client-bundle.ts` inlines every `@dsh-stack/*`
dependency into each consuming client bundle (`noExternal`), because the
loader's module table can only resolve a shared `require()` for a package
that declares `dsh.client`. A shared package that holds mutable state and
does not declare `dsh.client` therefore exists as one independent, desynced
instance per bundle it is inlined into.

## Decision

A `@dsh-stack/*` package that owns mutable client-side state shared across
more than one UI surface must declare `dsh.client` and provide that state as
a cordis service (`ctx.provide("<name>", instance)`), not export it as a
plain value for consumers to import and instantiate themselves. Consumers
inject the service (`export const inject = [..., "<name>"]`) rather than
importing the stateful export directly. This is the only path consistent
with the harness's plugin-loading model: once a package declares `dsh.client`
it is a governed plugin bundle, and plugin-to-plugin cooperation goes through
cordis inject/services, never a plugin-to-plugin value import of state.

`client-bundle.ts` excludes any `@dsh-stack/*` package that declares
`dsh.client` from `noExternal` automatically (scanned from sibling
`package.json` files at build time), so declaring the manifest is sufficient
to stop a package being duplicated into every consumer's bundle.

A package with no mutable state (presentational components, constants) does
not need this treatment: duplicating stateless code across bundles costs
bundle size, not correctness, so it stays a plain inlined dependency.

## Applied

`skin-runtime` (the active-skin id, consumed by `skin-host` and
`skin-settings`) and `sidebar-preferences` (sidebar toggle state, consumed by
`sidebar-settings` and `sidebar-shell`) were converted under this rule and
`@dsh-stack/plugin-kit/cross-bundle-channel` (the prior DOM-event/localStorage
workaround) was retired. `settings-panel` (pure presentational furniture, no
state) was left as an ordinary inlined dependency.
