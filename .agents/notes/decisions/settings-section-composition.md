# Native settings section composition

Status: active

## Ownership

DSH provides the client UI and native settings slots. Each feature package
registers only the settings content it owns. The Stack settings shell renders
a single navigation structure over registered `settings.section` entries.

## Appearance

The Appearance section owns the child slot `settings.appearance.tab` and
renders the tab strip and selected page. Its tabs are provided by independent
feature owners: theme studio, skins, icons and themes.

Each tab has a stable ID, order, label and component; registration through the
Cordis slot is independent of package activation order. Packages contribute
their own tab and glyph instead of embedding their UI in unrelated code.

Section glyphs register through `settings.section.icon` and refer only to
active settings section IDs. A missing or failed registration should surface
a meaningful UI state and be covered by a native DSH browser test.

## Verification

Settings navigation, tab selection, persistence, missing dependencies and
theme/skin/icon updates must work against the built client.
