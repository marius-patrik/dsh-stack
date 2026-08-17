# Request: Provider wire-truth round (Session 9)

> Source: CONTEXT.md session 10 (Aug 16 2026)
> Backfilled: 2026-08-17

## What happened

Propagated reverse-engineered subscription transports into harness plugins. Fixed
kimi-sub (OpenAI-compat at /coding/v1), grok-sub (OpenAI-compat at
cli-chat-proxy.grok.com/v1), claude-sub (oauth beta header), gemini-sub (code-assist
v1internal endpoint). Added code-assist dialect. Removed cursor-sub.

## User directives (preserved verbatim)

- kimi supposed to work (403 is real billing-cycle quota).
- No "dsh" prefix in opencode plugin names.
- Refresh should work for all providers.

## Wire facts (verified live)

- kimi: OpenAI-compat at https://api.kimi.com/coding/v1
- grok: OpenAI-compat at https://cli-chat-proxy.grok.com/v1 with identity headers
- claude: needs anthropic-beta: oauth-2025-04-20
- gemini: v1internal endpoint with OAuth bearer + wrapped body

## What was built

- dsh-dialects: code-assist dialect (wrapper serialize + SSE unwrap)
- dsh-providers: corrected all 13 routes, removed cursor-sub, added headers threading
- adapter.ts + index.ts: ProviderConnection → DialectAuth.headers

## Status

Completed. Boot-verified.
