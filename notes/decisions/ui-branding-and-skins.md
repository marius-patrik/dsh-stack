# UI branding and skins

Status: architecture directive

## Sidebar branding

The Stack workspace/sidebar must expose one ordinary user setting controlling the DeepSeek logo in the sidebar.

The setting controls both states:

- collapsed sidebar;
- expanded/uncollapsed sidebar.

The implementation must not duplicate the setting or maintain separate collapsed/expanded branding flags. The sidebar consumes a single resolved branding value and applies it to both render paths.

The setting should support at least:

- show the active/default brand logo;
- hide the logo.

Future branding/identity extensions should use the same seam rather than adding one-off DOM substitutions.

## Skin-owned branding

Skins are independently composable plugins. At minimum the product will ship skin plugins for:

- DeepSeek
- Claude
- Codex

Each skin owns the correct logo assets and related visual identity. A selected skin may replace the sidebar brand mark, subject to the user's explicit logo visibility setting.

Resolution precedence:

1. explicit user setting `show sidebar logo = false` hides the mark regardless of skin;
2. when enabled, the active skin supplies the logo/brand asset;
3. the default skin supplies the fallback/default brand.

A skin must not patch the sidebar implementation directly. It registers branding through the canonical Stack skin/branding capability or the appropriate DSH UI seam.

## Skin package boundary

Every skin is its own plugin.

A skin plugin may own:

- logo/brand assets;
- colors/tokens;
- typography choices where supported;
- icons/visual assets;
- skin-specific UI metadata;
- optional effects/assets allowed by the common skin contract.

It must not reimplement generic sidebar, tabs, settings, theme loading, or workspace functionality.

## Settings UI

Use DSH's ordinary plugin/settings surface as the baseline. Do not introduce the oversized legacy Stack plugin-settings shell merely to support skins or sidebar branding.

Extend the native settings surface only where necessary, preserving its normal visual density, navigation and interaction model.

Skin selection and the sidebar logo toggle should appear in appropriate concise settings sections. Skin-specific settings belong to the owning skin plugin rather than a monolithic global settings panel.

## No-duplicate rule

There must be exactly one canonical implementation for:

- sidebar rendering;
- logo visibility state;
- skin selection;
- skin loading/application.

Branding plugins provide assets/metadata through those seams; they do not fork the UI.