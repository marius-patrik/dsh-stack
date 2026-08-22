# DSH Stack Product Requirements

## Product

DSH Stack is a polished, distributable extension layer for DeepSeek Harness. The repository ships the runtime-facing plugins, reusable support libraries, profile packs, external integrations, skins, UI extensions, credential capabilities, agents, coding/trading/SkyBlock domains, and the distribution/update system as one coherent product.

## Architecture

The repository has one implementation root: `plugins/`. Every user-visible capability is a plugin. Reusable mechanics are support-library packages. Packs compose plugins; they do not duplicate runtime behavior. Dependencies can be required or optional, and packs can bundle other packs.

The harness submodule is pristine upstream. Stack integrates through its public extension seams, native agent-preset mechanism, configuration, filesystem/host services, slots, settings sections, and provider contracts.

## Profiles

The shipped profiles are Default, Coding, Trading, and SkyBlock. DarkFactory behavior is incorporated into Coding. SkyAgent behavior is incorporated into SkyBlock. Trading incorporates DSH Trading and MoneyMaker capabilities without preserving either application's shell as a second implementation.

## UI

The sidebar is a native Stack shell using DSH's supported slot system. It provides action buttons above Files, Files instead of Workspaces, muted Host/Container roots, filesystem row menus, profile selection above Settings, optional New Conversation visibility, profile-aware settings, skin-aware branding, and polished responsive behavior.

The workspace includes unified conversation, terminal, and container tabs; real filesystem browsing; three-dot file actions; file-type icons supplied by a separate VS Code icon plugin; collapsible sections; mobile layouts; and settings navigation/resize behavior.

## Settings and skins

Settings has a dedicated Profiles section and a compact Sidebar section. Sidebar preferences include hiding the large New Conversation action and hiding the DeepSeek logo in both expanded and collapsed states.

Claude, Codex, and DeepSeek skins are independent plugins. Only the active skin owns the brand slots. The sidebar itself is brand-agnostic.

## Credentials

Credential support covers passwords, API keys, OAuth credentials, TOTP/OTP seeds and QR provisioning, recovery codes, passkeys/WebAuthn metadata, SSH material, certificates, cookie/session material, and generic secure notes. Secrets are stored through the DSH credential seam and Stack's encrypted vault layer, never embedded into ordinary configuration.

## Agents

Agent composition uses DSH's native agent preset primitive. Stack supplies preset resources, persona catalogs, live persona state, commands, and profile composition without creating a parallel agent runtime.

## Integrations

Each external integration is an independent plugin. GitHub, GitHub Projects, Trello, Git/VCS, provider APIs, terminals, LSP, Docker, themes, and other external systems remain isolated feature packages. No integration owns another integration's implementation.

## Distribution

Every plugin and pack is independently versioned and published as an npm package using one standard package contract. Stack itself is versioned at the repository root.

Every merge into `main` produces a release. The Stack version increments on every release. A plugin or pack version increments only when that package changed, using semantic-version bump rules derived from the change. The release contains every package as an individual artifact, plus a complete machine-readable manifest with exact versions, package names, integrity hashes, dependencies, capabilities, and release metadata.

The plugin updater consumes the release manifest, compares installed package versions, resolves dependency constraints, downloads signed release artifacts, verifies integrity, stages updates atomically, and activates updates through the host's supported restart/reload boundary.

## Quality bar

There is one implementation per feature. No compatibility bridges, legacy migration code, duplicate source trees, placeholder runtime services, generated-source copies, or fake UI state are accepted. CI must typecheck, build, verify package contracts, detect duplicate source bodies, run package tests, and build the complete release bundle.
