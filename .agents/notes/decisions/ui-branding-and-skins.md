# UI branding and skins

Status: architecture directive

## Sidebar branding

The Stack workspace/sidebar exposes one ordinary user setting controlling the active brand logo in the sidebar. The setting controls both collapsed and expanded states and must not be duplicated.

The setting supports showing the active/default brand logo or hiding the logo. Future branding extensions use the same seam rather than one-off DOM substitutions.

## Skin-owned branding

Skins are independently composable plugins. At minimum the product ships skin plugins for DeepSeek, Claude and Codex. Each skin owns its logo assets and related visual identity.

Resolution precedence:

1. explicit user setting `show sidebar logo = false` hides the mark regardless of skin;
2. when enabled, the active skin supplies the logo/brand asset;
3. the default skin supplies the fallback/default brand.

A skin must not patch the sidebar implementation directly. It registers branding through the canonical Stack skin/branding capability or the appropriate DSH UI seam.

## Skin package boundary

Every skin is its own plugin. A skin may own logo/brand assets, colors/tokens, typography choices where supported, icons/visual assets, skin-specific UI metadata, and optional effects/assets allowed by the common skin contract. It must not reimplement generic sidebar, tabs, settings, theme loading, or workspace functionality.

## Settings UI

Use DSH's ordinary plugin/settings surface as the baseline. Do not introduce an oversized legacy Stack plugin-settings shell merely to support skins or sidebar branding.

## No-duplicate rule

There must be exactly one canonical implementation for sidebar rendering, logo visibility state, skin selection, and skin loading/application. Branding plugins provide assets/metadata through those seams; they do not fork the UI.
