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
    agents/                    Agents bundle, agent plugin and related extensions
    ai/                        AI bundle
      providers/               Providers bundle with implementation plugins
    integrations/              Integrations bundle
      formatters/              Formatters bundle and implementation
      hosts/                   Hosts bundle and implementation
      lsp/                     LSP bundle and implementation
    ux/                        UX bundle
      themes/                  Themes bundle and related plugins
      tweaks/                  Tweaks bundle
      voice/                   Voice bundle and plugin
    <name>/                    Plugins mounted directly by full Stack
  headless/                    @dsh-stack/stack-headless bundle
    dsh-tui/                   Chimney third-party source submodule (external release)
```

Every nested `package.json` is still an independently publishable npm package. The physical folders follow bundle ownership, while the native `stack.compose` dependency DAG and Cordis patch rows determine runtime activation. Placing an optional plugin in a bundle's source folder does not activate it automatically. Shared bundles (for example between full Stack and headless) are not duplicated.

## Native installation

```sh
dsh plugin --profile web add @dsh-stack/stack
dsh --profile web --dump-config
dsh --profile web
```

For TUI use [the TUI profile](profiles/tui/README.md) and Chimney's compatible `@deepseek-harness-tui/dsh-tui`. Headless installation uses `@dsh-stack/stack-headless`. DSH user profiles are maintained by DSH, not by Stack.

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
