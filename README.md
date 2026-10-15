# DSH Stack

Native plugins, recursively composed bundles, and shared libraries for DeepSeek Harness. DSH owns runtime, installation, activation, profile configuration, updates, and lifecycle. Stack publishes ordinary native DSH packages and declarative composition patches.

## Source ownership

```text
packages/
  stack/                 @dsh-stack/stack native aggregate
    agents/              Agent bundle and agent/tool packages
    ai/providers/        AI providers, dialects, credential packages
    integrations/        Host, repository, LSP and domain packages
    ux/                  Sidebar, settings, themes, skins and tweaks
    plugin-kit/          Shared plugin library, test kit, client build inputs
  Cognition/             Independent upstream source submodule
  DarkFactory/           Independent upstream source submodule
  dsh-tui/               Independent Chimney TUI source submodule
.github/
  scripts/               CI, build, verification, release and publication tooling
  workflows/             CI and release automation
```

Every native package manifest under `packages/stack/` is an independent npm package boundary, with nested bundle declarations resolved through `stack.compose` and generated native `dsh.bundle.patch` layers. Folder proximity never activates a plugin. Independent external source gitlinks are not Stack packages.

**Profiles are entirely DSH-owned.** There are no Stack profile templates, browser-side Stack profile selector, profile installation scripts, or profile state management. Stack can be installed into an existing DSH profile using DSH's normal commands; the same package graph serves every surface.

## Install via DSH

```sh
dsh plugin --profile web add @dsh-stack/stack
dsh --profile web --dump-config
```

The profile name is a DSH argument, not Stack configuration. Chimney's independently released `@deepseek-harness-tui/dsh-tui` is installed and activated through DSH, not automatically by Stack.

## Development

```sh
bun install
bun run build
bun run typecheck
bun run verify
bun run test
bun run release:assets
bun run release:verify
```

Stack does not vendor or build the three external source submodules. Fetch their pinned revisions with `git submodule update --init packages/Cognition packages/DarkFactory packages/dsh-tui`. See [distribution](.agents/notes/native-npm-publication.md) and [contributor rules](.agents/AGENTS.md).
