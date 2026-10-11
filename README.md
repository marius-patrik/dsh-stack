# DSH Stack

First-class plugins, recursive bundles, and actual native profile templates for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). DSH exclusively owns the runtime, CLI, profile storage, package installation, activation, updates, and lifecycle. Stack supplies packages and declarative composition.

## Repository

- `plugins/<name>/`: flat independent implementation packages (including reusable libraries and Cordis plugins).
- `bundles/**/`: arbitrarily nested *leaf* packages with `dsh.bundle.patch` metadata. Parent bundles recursively compose children at build time, producing one normal native DSH patch, not a runtime manager.
- `profiles/<name>/`: actual `dsh.profile.bundles` profile manifest and `cordis.patch.yml` templates. These are profile directories, **not** npm bundles. DSH maintains the installed profiles under its own home directory.
- `scripts/`: build, verification, and publication only.

The `plugins/Memory` gitlink is staged external source and not a managed runtime installation. The `_migrate/` sources are not part of the installed Stack.

## Native DSH installation

Install DSH independently via its own official distribution and package manager. Once Stack packages have been published, install the complete Web experience using the native DSH command:

```sh
dsh plugin --profile web add @dsh-stack/stack
dsh --profile web --dump-config
dsh --profile web
```

For a headless installation use `dsh plugin --profile headless add @dsh-stack/stack-headless`. Smaller nested bundles can be installed individually. The package manager installs dependencies, and users may enable optional plugins via normal DSH profile patches or the native plugin UI.

The files under `profiles/` are deployable native-profile templates; copying them directly into a DSH home is an explicit user operation, not a Stack CLI feature. Never introduce a separate launcher, symlink manager, profile mutation layer, or updater. DSH's native profile manager is authoritative.

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

`bun run build` generates the deterministic recursive bundle patches before compiling plugins. Compiled `dist/` and `lib/` are not tracked. The release pipeline packages independently publishable npm tarballs with resolved exact package versions rather than shipping a replacement runtime.

Repository rules and contributor guidance live in [`.agents/AGENTS.md`](.agents/AGENTS.md). The architectural migration is tracked by [P0 issue #320](https://github.com/marius-patrik/dsh-stack/issues/320).
