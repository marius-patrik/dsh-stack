# DSH Stack

Native DeepSeek Harness plugins, bundles and profile templates live in **one composition tree**. DSH owns installation, runtime, updates and activation; Stack ships native packages and declarative composition.

## Composition tree

```text
composition/
  profile-web/           Native Web profile template
  profile-headless/      Native headless profile template
  profile-tui/           Native terminal profile and pinned Chimney TUI source
  stack/                 @dsh-stack/stack aggregate bundle
    agents/              Agents bundle and mounted agent plugin
    ai/providers/        AI and providers bundles and mounted plugins
    integrations/        Integrations bundle (formatters, hosts, LSP)
    ux/                  UX bundle (themes, tweaks, voice)
    <plugin>/            Plugins directly mounted by the aggregate bundle
  headless/              @dsh-stack/stack-headless native bundle
  standalone/            Optional publishable plugins not auto-mounted by Stack
```

The native bundle graph is a DAG, not a tree: packages referenced by both full Stack and headless are stored only once. Their names, `stack.compose` edges, and native patches control actual installation. Nesting never introduces a second loader.

## Install

```sh
dsh plugin --profile web add @dsh-stack/stack
dsh --profile web --dump-config
dsh --profile web
```

Headless installation uses `@dsh-stack/stack-headless`. Terminal usage is documented in [the TUI profile](composition/profile-tui/README.md). Profile templates are DSH-owned on installation and are never mutated by an independent Stack manager.

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

Packages are discovered recursively in `composition/`, and each native bundle is flattened before packaging. Migration-only gitlinks under `_migrate/` are not installed. See [native npm publication](.agents/notes/native-npm-publication.md) and [contributor rules](.agents/AGENTS.md).
