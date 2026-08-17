# Session 16 — settings/providers overhaul + loops + zen

**Date:** 2026-08-17
**Status:** new

## Raw user prompt (verbatim)

> pick up latest open/privatecode working on agents super repo/dsh project exactly where it left but first reconstruct/orient yourself and allign ful context then fully take over and take this as my next request: for example the vs code themes catalog is still missing, keychain still has wrong icon and its an embeded page inside the modal and completely underimplemented, agent presets should have been split across session modes and agents - both agents and session mode tabs are inadequate - by the end rename the final agent to Agents and Session Modes to Actions - rename the plugin as well repo and everything, models tab doesnt show indicator for subscribtions - it should be clear whether we have auth and quota as well - merge qutoas and models into providers - merge subcriptions quotas and providers plugins into providers, tools via tools plugin should be exposed in settings - give user full control over tools ; new plugin - loops goal based loops loaded from .agents/loops predefinable criteria and workflows including some deterministic orchestration and editable via agent tools or in settings, via tweaks plugins should be able to be enabled and disabled in settings with a popup that effect will be on reload and button to reload; actions should also live under .agents/actions ; implement opencode zen provider for dsh stack with auth quotas and everything

## Parsed work items

1. **Themes catalog UI** — VS Code theme catalog (Open VSX search/install) still missing from the Themes settings tab (currently switcher-only).
2. **Keychain overhaul** — wrong nav icon; currently an embedded page inside the settings modal; completely underimplemented → full typed-record CRUD section.
3. **Agents/Actions split** — agent presets should be split across session modes and agents; both tabs inadequate; rename harness "Agent" section → "Agents", "Session Modes" → "Actions".
4. **Plugin rename** — dsh-session-modes → dsh-actions: package, repo, profile wiring, everything.
5. **Providers consolidation** — Models tab lacks subscription/auth/quota indicators; merge Quotas + Models settings tabs into "Providers"; merge dsh-subscriptions + dsh-quotas + dsh-providers plugins into single dsh-providers.
6. **Tools settings UI** — dsh-tools exposed in settings, full user control over tools.
7. **New plugin: dsh-loops** — goal-based loops from .agents/loops, predefinable criteria + workflows + deterministic orchestration, editable via agent tools or settings.
8. **Plugin enable/disable** — via dsh-tweaks, in settings, with "effect on reload" popup + reload button.
9. **Actions under .agents/actions** — file-based action definitions.
10. **OpenCode Zen provider** — auth + quotas + everything, in dsh-providers.
