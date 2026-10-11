# KiKi

KiKi is a collection of native plugins and supporting packages for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness). DSH owns the runtime, its installation, profiles, package management, and plugin lifecycle. This repository does not vendor or pin the harness.

## Repository layout

- `plugins/` — independently versioned Stack packages, grouped by logical domain. The groups are organizational, not runtime bundles or profile compositions.
- `plugins/Memory/` — staged external Memory plugin source pending migration.
- `_migrate/` — temporary source repositories used only for migration, not runtime deployment.
- `scripts/` — Stack development and release tooling.

## Native installation

Install and run DSH separately using its official distribution. Install any Stack package that declares `dsh.bundle` through DSH's native profile command, for example from a built Stack checkout:

```sh
bun install
bun run build
dsh plugin --profile web add ./plugins/ux/themes
dsh --profile web --dump-config
```

DSH, not KiKi, manages installed packages and the active profile. The top-level Stack workspace is **not** a DSH bundle; install the individual native bundles or their published artifacts. Packages without `dsh.bundle` are libraries or standalone tools and do not activate a plugin layer on their own.

For a development integration that needs an upstream source checkout, use an *external* DSH checkout and set `DSH_HARNESS` to its path. No harness checkout is part of this Git repository.

## Development

```sh
bun install
bun run build
bun run typecheck
bun run verify
bun run test
```

Repository rules and contributor guidance live in [`.agents/AGENTS.md`](.agents/AGENTS.md).
