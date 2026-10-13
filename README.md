# DSH Stack

Native DeepSeek Harness plugins, nested bundles, and real profile templates. DSH retains ownership of package installation, profile activation, updates, runtime and CLI; Stack distributes native packages and declarative patches.

## Native composition tree

```text
profiles/
  web/                         Native Web profile template
  headless/                    Native headless profile template
  tui/                         Native TUI profile template
plugins/
  stack/                       @dsh-stack/stack full bundle
    agents/                    Agents bundle, agents, presets, tools and loops
    ai/                        AI bundle
      providers/               Providers bundle, dialects, credential-vault, models and provider adapters
    integrations/              Integrations bundle, repos, workspace and trading tooling
      formatters/              Formatters bundle and implementation
      hosts/                   Hosts bundle and implementation
      lsp/                     LSP bundle and implementation
    ux/                        UX bundle
      themes/                  Themes bundle, icons and skins
      tweaks/                  Tweaks bundle and tweak implementations
      voice/                   Voice bundle and plugin
    plugin-kit/                Shared native plugin foundation (package)
  dsh-tui/                     Chimney independent external plugin source submodule (TUI-only)
```

Every nested `package.json` is still an independently publishable npm package. The physical folders follow bundle ownership, while the native `stack.compose` dependency DAG and Cordis patch rows determine runtime activation. Placing an optional plugin in a bundle's source folder does not activate it automatically. Shared bundles (for example between full Stack and headless) are not duplicated.

## Native installation

```sh
dsh plugin --profile web add @dsh-stack/stack
dsh --profile web --dump-config
dsh --profile web
```

For Headless install the **same** `@dsh-stack/stack` package into the `headless` profile. For TUI install the same Stack bundle plus Chimney's compatible `@deepseek-harness-tui/dsh-tui` following [the TUI profile](profiles/tui/README.md). All three profiles compose one nested Stack plugin tree, not three forks; DSH manages the profile surfaces and lifecycle.

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

The build walks all nested plugin and bundle package manifests. `_migrate/` is not part of an installed Stack. See [native npm publication](.agents/notes/native-npm-publication.md) and [contributor rules](.agents/AGENTS.md).
