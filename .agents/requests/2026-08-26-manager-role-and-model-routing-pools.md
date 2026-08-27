---
date: 2026-08-26
session: kimi takeover (session_17c7d58e)
issues: [79, 80, 55, 52, 61, 50]
status: scoped
---

## Manager role, multi-pool model routing, headless-agents-first reprioritization

> I dont really care about the approach I just want you to make sure the repo progresses as fast as possible so I get to use the harness currently the web ui still has empty sidebar

> so your job is to sequence watch and make sure the work gets done properly - you are the manager watching the shift
>
> - we should implement this as an agent preset - manager
>
> and not just properly but efficiently and parralalize as much as possible and utilize all available resources - meaning model routing should split across all available usage pools and we should strive to have as many as possible - for example at this point you should already be able to utilize opencode zen, xai grok, antigravity gemini, cursor and we want more
>
> but yes as well we should probably priorotize the dhs work routing before the web ui - first you should make sure agents work headlessly then we can focus on web ui - quotas model routing credentials and providers and autoresolved model lists...

### Semantic decomposition

- **Driving sessions are managers**: sequence, watch, verify; maximize parallel dispatch; never let a lane sit idle when work is dispatchable.
- **Manager as an agent preset** — a first-class `agent-preset-manager` extension (issue #80), not just session behavior.
- **Model routing across all usage pools** (issue #79, epic): opencode zen, xAI grok, antigravity gemini, cursor, and more; sub-areas = quotas (#55), model routing, credentials & providers, autoresolved model lists, headless dispatch (#52/#61).
- **Priority shift**: DSH work-routing (headless agents first) outranks the web-UI audit — #50 is no longer the top of the severity queue; #79's children are.
- The empty-sidebar complaint was resolved same-session by wiring the live profile to `@dsh-stack/pack-bundle` from the boot-wiring worktree (PR #63) — 28/28 stack plugins active on the live instance.
