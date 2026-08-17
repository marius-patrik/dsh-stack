# Request: OAuth token refresh seams for every subscription provider (Session 10)

> Source: CONTEXT.md session 11 (Aug 16 2026)
> Backfilled: 2026-08-17

## What happened

Built per-request refresh seams that rotate and persist token bundles for all four
subscription providers. Reverse-engineered refresh endpoints for claude, kimi, grok,
gemini. Implemented in both privatecode plugin and dsh-providers.

## User directives (preserved verbatim)

- Refresh should work for all providers.
- Never commit secrets — Gemini client secret moved to vault refs
  (GEMINI_SUB_CLIENT_ID, GEMINI_SUB_CLIENT_SECRET).

## Refresh endpoints (verified live with curl)

- claude: POST https://api.anthropic.com/v1/oauth/token (refresh tokens ROTATE)
- kimi: POST https://auth.kimi.com/api/oauth/token (expires_in: 900)
- grok: POST https://auth.x.ai/oauth2/token (rotates + revokes old)
- gemini: POST https://oauth2.googleapis.com/token (durable, non-rotating secret)

## Caveats

- claude and grok refresh tokens are single-use (rotated) — probing consumed them
- One-time interactive re-login needed for claude + grok after probing
- kimi and gemini material remains healthy

## What was built

- privatecode plugin: oauthRefresh, persistAuth, singleflight per provider
- dsh-providers: OAUTH_REFRESHERS table, readToken, write through ctx.accounts.set

## Status

Completed. Both seams shipped + live-verified.
