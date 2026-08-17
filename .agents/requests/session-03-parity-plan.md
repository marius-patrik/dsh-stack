# Request: opencode↔dsh parity + product plan (Session 3)

> Source: CONTEXT.md session 3 (`ses_0004c6e67f`, 39 msgs, Aug 14 late 2026)
> Backfilled: 2026-08-17

## What happened

Deep comparison of opencode vs dsh capabilities. Created a 21-row delta table
mapping every missing feature. Product direction decided: desktop via Tauri,
mobile via PWA over Tailscale.

## User directives (preserved verbatim)

- Tauri wrap: "Tauri v2 chromeless window + small Cordis lifecycle plugin that
  spawns dsh web and hands the URL to the shell."
- Mobile-first → PWA, not Tauri mobile.
- Tailscale enablement with cordis.patch.yml for trustedHosts.
- Dropped: IDE extension, install matrix, subscription OAuth logins
  Copilot/ChatGPT, Enterprise docs.

## Key decisions

- Desktop: Tauri v2 shell + lifecycle plugin
- Mobile: PWA + Tailscale (responsive pass, touch targets, safe-area)
- Tailscale: 0.0.0.0 bind + trustedHosts OR 127.0.0.1 + tailscale serve
- Row/package ids mapped for cordis patches

## Status

Completed. Product plan documented.
