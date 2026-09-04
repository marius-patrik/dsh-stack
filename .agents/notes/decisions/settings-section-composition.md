# Composing one settings section out of several packages

Status: architecture directive

## Problem

Personalization listed Skins, Icons, Themes and Appearance as four sibling
settings sections. Each was a `settings.section` entry owned by a different
package: `skin-settings` (`skins`), `providers` (`icons`), `themes` (`themes`)
and `tweaks` (`appearance`). Merging them into one Appearance destination means
one section's body has to be assembled from four packages that must not import
each other — `providers`, `themes` and `skin-settings` have no dependency
relationship, and giving them one to satisfy a nav layout would invert the
direction the plugin model runs in.

Three shapes were available:

1. The Appearance owner imports the three other packages' section components
   and renders them itself. This makes `tweaks` a consumer of three unrelated
   feature packages and forces every future appearance page to edit `tweaks`.
2. Each source package exports its section body as a sub-component that
   `tweaks` composes. Same coupling as (1), only spelled as an export contract
   instead of a deep import.
3. Appearance declares a child slot and renders whatever registers into it.

## Decision

Appearance is a composition point, not a page: shape (3).

The `appearance` `settings.section` entry declares one child slot,
`settings.appearance.tab` (list, root scope), and renders a tab strip over the
slot's ledger plus the selected entry's component. Every appearance page —
including the palette studio that already lived in `tweaks` — is a registrant
of that seat, identified by `id`, positioned by `order` and named by `label`.
No registrant is special-cased for living in the section owner's package.

This is the arrangement the settings shell already uses one level up: the shell
declares `settings.section` and renders `renderSlot("settings.section", …,
{ only: active })` over a ledger-derived row list, and it is what the harness's
own `settings.plugins.tab` seat documents for a section with pages inside it.
Registration order across bundles does not matter — `ctx.slots.inject` defers a
registration until its target slot is declared, which is how sections owned by
other packages already reach the shell's seat.

The seat's TypeScript face lives in `@dsh-stack/settings-panel`
(`src/appearance-tab-slot.ts`), beside the `settings.section.icon` declaration
and for the same reason: the section that declares the seat at runtime is
hand-authored JavaScript with no TypeScript face, and `settings-panel` is the
package every Stack settings registrant already depends on.

A retired section takes its `settings.section.icon` registration with it. The
glyph seat is keyed by section id and feeds the shell's nav rows, so a glyph
registered for an id that is no longer a nav row is dead code, not a fallback.
The merged section keeps its own glyph.

## Applied

`settings.appearance.tab` carries four entries: `theme-studio` (order 0,
`tweaks`), `skins` (10, `skin-settings`), `icons` (20, `providers`) and
`themes` (30, `themes`). Each kept its existing component, inject face and
persistence untouched; only the slot it registers into changed. The `skins`,
`icons` and `themes` `settings.section` and `settings.section.icon`
registrations were removed, along with `themes`' and `providers`' now-unused
nav glyph components and `skin-settings`' dependency on
`@dsh-stack/lucide-animated`.

The ledger-to-rows projection the shell used for its nav is now
`makeSlotRowsSource(ctx, slotName)` in `tweaks/client.js`, shared by the
section nav and the Appearance tab strip, and the pill strip
`CustomizationSettingsSection` hand-rolled is now `SettingsSubtabStrip`, used
by both multi-page sections.
