# Stack PRD

## Product

DSH Stack is a polished, distributable extension system for DeepSeek Harness. DSH remains the runtime and composition authority; Stack supplies independently versioned plugins, native bundles, reusable support libraries, integrations, and reproducible release artifacts.

## Architecture

The canonical source is one recursive `packages/` tree with independently publishable native bundles and their implementation plugins colocated under the corresponding bundle ownership folders. No native profiles are authored in this repository. Physical nesting does not automatically mount optional plugins. Every feature has a single implementation owner. The canonical `@dsh-stack/stack` composition is identical in Web, Headless and TUI profiles. DSH-provided base/surface packages and optional independent TUI presentation adapter are profile concerns, not alternative Stack bundles.

DSH owns installation, profiles, runtime, lifecycle, update/removal, and CLI. Parent bundle dependencies are flattened at build time into ordinary native patches; there is no custom runtime composition or profile manager. Users may manually activate optional capabilities in DSH.

## Runtime boundary

DSH alone configures, selects, installs, upgrades and activates profiles. Stack supplies no profile templates, selection UI or profile-specific composition manager. Coding and trading remain feature/domain packages, not Stack profiles.

## UI shell

The Stack UI uses DSH's native slot/composition seams and does not mutate the DOM. The sidebar is a canonical implementation with action buttons above Files, configurable New Conversation visibility, configurable brand-logo visibility, file/folder rows, three-dot context menus, muted host/container sections, and a coherent collapsed/expanded layout.

The Files view uses DSH filesystem capabilities. Tabs, panes, terminals, conversations, containers, and workspaces share one tab model. File icons are resolved through an icon service; VS Code icon support is its own plugin.

Settings contains sidebar preferences, credentials, agents/personas, quotas, providers/models, and other feature-owned sections. Settings remains compact and feature-owned sections do not duplicate shell state.

Everything that changes how the Stack looks lives under one Appearance section rather than as sibling entries in the settings nav: the theme studio, skins, icons, and themes are pages inside it. Appearance owns no controls of its own — each page stays implemented by the package that owns it and registers into the section's `settings.appearance.tab` seat, so adding an appearance page never means editing the section.

Quota status belongs alongside provider and account configuration, with measured usage, status and reset information attached to the corresponding cards. Each distinct account has its own measured state. The `QuotaRegistry`/`QuotaSnapshot` probing engine and its `/quotas/api/*` endpoints remain the one data source both the built-in provider cards and the custom-vendor breakdown read from.

## Skins and branding

DeepSeek, Claude, and Codex skins are separate plugins. Each owns its branding assets and plugs into the single Stack skin host. The sidebar is brand-agnostic. The DeepSeek logo can be hidden independently in collapsed and expanded sidebar states.

## Agents

Agents use DSH's native agent-preset primitive. Stack supplies actual preset resources and composition, never a synthetic agent manager. Personas are durable session state, independent of session modes, and can be switched during a conversation. Agent/preset UI and commands operate through DSH's native seams.

## Credentials

The credential stack supports API keys, passwords, TOTP seeds and QR provisioning, OAuth grants, passkeys/WebAuthn metadata, recovery codes, SSH keys, certificates, cookie jars, and generic secrets. Secret material is kept behind the credential seam; provider configuration stores references rather than raw secrets. The vault uses authenticated encryption and explicit secret typing.

## Coding and integrations

Repository, workspace, host, formatting, LSP and terminal capabilities are
implemented as separately owned packages under `packages/stack/integrations/`.
DarkFactory and Cognition remain independently maintained source dependencies.
A feature is published only when its native DSH integration and runtime behavior
are implemented and verified.

## Trading

Research, market-data, backtest and optimization packages are optional domain
capabilities. A claim of market accuracy or backtest support requires
provider-backed inputs and deterministic, externally verified behavior.

## Packaging and distribution

Each public plugin and each native DSH bundle is an independently publishable npm package. The repository root coordinates releases. The build generator emits deterministic native patches from recursive bundle dependency declarations. Release assets have exact package versions, dependency closure and integrity data; installable packages do not contain `workspace:` references.

The external DSH runtime and native package manager install, update, activate, and remove bundles. Stack does not own a substitute launcher, installer, profile reconciler or updater.

## Quality bar

No duplicate implementations, compatibility bridges, migration shims, legacy detectors, placeholder services, checked-in generated output, unchecked unsafe casts, or unfinished markers. CI is the executable quality gate. UI work is considered complete only when it is connected to actual DSH seams and behaves coherently in the real client.
