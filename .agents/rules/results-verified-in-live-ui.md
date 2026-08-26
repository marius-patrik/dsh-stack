---
date: 2026-08-26
session: kimi takeover (session_17c7d58e)
status: active
---

# Results are verified in the live web UI

> and when I ask for results I myself care only about actually seeing it in the live web ui app

## Rule

A piece of work is only "done" when its result is visible in the live web UI app — not when CI is green, not when an HTTP endpoint returns 200, not when a report file says so.

- Every user-facing result claim must be backed by a real browser check against the running harness (screenshot or DOM assertion), per the standing browser-verification-before-merge rule.
- CI green, curl 200s, and verify-chain passes are necessary preconditions, never the result itself.
- When reporting results to the user, lead with what is visibly working in the UI and what was actually observed there.
