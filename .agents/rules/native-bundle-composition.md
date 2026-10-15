# Native bundle composition

- A **plugin** is a concrete, independently published DSH capability under
  `packages/stack/`.
- A **bundle** is a native DSH package declaring `dsh.bundle.patch`,
  required child dependencies and optional `stack.compose` build-time edges.
- Physical nesting records source ownership; it never activates an optional
  plugin by itself.
- DSH owns profile manifests, installed user state, package activation and
  lifecycle. Stack publishes one common composition graph for compatible
  DSH surfaces.
