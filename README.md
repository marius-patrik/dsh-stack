# DSH Stack

A distributable plugin and pack stack for DeepSeek Harness.

## Structure

```text
AGENTS.md
notes/        product requirements, architecture, plans, decisions
plugins/      every Stack plugin, support library, and pack
harness/      pinned pristine DSH runtime
scripts/      verification and release tooling
```

`plugins/` is the only application implementation root. Every publishable plugin or pack has its own package, version, dependency graph, tests and verification contract. Support libraries contain reusable mechanics; external integrations are separate plugins; packs compose plugins rather than implementing features a second time.

## Profiles

| Profile | Purpose |
| --- | --- |
| `@dsh-stack/profile-default` | general Stack experience |
| `@dsh-stack/profile-coding` | coding, repositories, tools, editor/LSP and absorbed DarkFactory capabilities |
| `@dsh-stack/profile-trading` | research, backtesting, optimization and absorbed MoneyMaker capabilities |
| `@dsh-stack/profile-skyblock` | SkyBlock capabilities absorbed from SkyAgent |

## UI

The Stack shell uses DSH-native slots. The sidebar provides Files, file-row actions, profile selection, configurable New Conversation/logo visibility, skins, coherent collapsed/expanded behavior, and unified workspace/tab concepts. VS Code icons are an independent plugin. DeepSeek, Claude and Codex skins are independent plugins.

## Credentials and agents

Credentials support typed secrets such as API keys, passwords, TOTP/QR provisioning, OAuth, passkeys, recovery codes, SSH keys, certificates and generic notes. Agents use DSH's native preset primitive; personas are durable session state independent from session modes.

## Distribution

Every plugin and pack is independently versioned and published. Every merge to `main` increments the Stack version. Only packages modified by the merge receive a package semver bump. The release publishes all newly versioned packages and creates a complete release manifest/catalog containing every plugin and pack with exact versions, dependencies and integrity information. The updater plugin consumes that catalog and performs dependency-aware updates.

## Quality gate

Pull requests must pass **Canonical Stack workspace** CI: install, recursive typecheck, build, package-contract verification, duplicate/unfinished-code checks, and tests. No compatibility bridge, migration shim, legacy detector, duplicate implementation, checked-in generated output, or placeholder feature is permitted.

## Development

```bash
pnpm install
pnpm typecheck
pnpm build
pnpm verify
pnpm test
```

The canonical product and implementation decisions live under `notes/`; repository agent instructions live in root `AGENTS.md`.
