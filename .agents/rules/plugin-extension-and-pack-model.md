# Native package and bundle ownership

- A **plugin** is a concrete, independently published DSH implementation below `packages/stack/`.
- A **bundle** is an ordinary native DSH package declaring `dsh.bundle.patch`, with child package dependencies and an optional `stack.compose` graph flattened at build time.
- Physical directory nesting records ownership; it never activates an optional plugin.
- DeepSeek Harness alone manages profiles, native plugin installation, activation and user state. Stack does not provide profile templates or a profile runtime.
