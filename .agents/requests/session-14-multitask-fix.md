# Request: Multi-account, dsh-tui, session-modes, quotas, harness fix (Session 14)

> Source: CONTEXT.md session 14 (Aug 17 2026)
> Backfilled: 2026-08-17

## What happened

Four high-priority tasks completed + harness acknowledgement fix shipped.
All 16 plugin check-plugin suites green.

## Tasks completed

### 1. dsh-credentials multi-account support (two commits)
- slugRecordId(ref, account?) appends --<account-slug> for coexistence
- recordForRef(ref, value, { account? }) tags with account:<name>
- resolveFor(ref, account) resolves specific account
- resolveAll(ref) returns all records across accounts
- set/unset accept optional account parameter
- Web API: GET/PUT/DELETE support ?account=<name> query
- CLI: vault add --account <a>, vault list shows ACCOUNT column

### 2. dsh-tui standalone HTTP client
- No cordis dependency — pure Node.js HTTP client
- DshClient: HTTP POST RPC + SSE mux streaming via fetch()
- protocol.ts: wire format types matching harness shapes
- tui.ts: readline + ANSI escape codes, status bar, stream buffer
- commands.ts: /session, /model, /goal, /cancel, /help, /exit
- Auto-connects, auto-selects latest session, reconnects on error

### 3. dsh-session-modes durable mode kernel
- GET /session-modes: mode catalog and config
- GET /session-modes/current: query current mode for an agent
- GET /session-modes/history: mode definitions, transitions, tool/route policies
- Durable persistence via session-mode/selected events

### 4. dsh-quotas quota dashboard
- GET /quotas: full HTML dashboard with dark theme, status colors, usage meter bars
- GET /quotas/api/summary: aggregated counts
- POST /quotas/api/refresh: refresh all providers
- POST /quotas/api/refresh/:provider: refresh single provider
- Meter bar: [████████░░░░] 67% with color coding

### 5. Harness acknowledgement fix
- Root cause: dsh-tweaks claimed to disable ui-settings-general but web-profile
  cordis.patch.yml still had it active. Both registered ui-onboarding settings
  namespace → duplicate registration failure → welcome notice broken.
- Fix: dsh-tweaks/cordis.patch.yml disables ui-settings-general + bundle.patch
  reference in package.json. Committed 4ef23aa.

## Status

Completed. All 4 tasks + fix shipped. 16 plugin check-plugin suites green.
