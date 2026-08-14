# agents + Andromeda port plan

The DeepSeek Harness (`dsh`) is the home for everything agent/credential/provider.
Andromeda is the porting source, not part of this project. Ported subsystems are
removed from Andromeda as a **progress marker** — removal says "we've moved past
this" — and breaking Andromeda in the process is accepted. Orchestrator, memory,
and the state files stay in Andromeda as port-source for future plugins.

## Repos

All under `marius-patrik`. Plugins are git submodules of the `agents` superproject.

| Repo | Visibility | Role |
|---|---|---|
| `agents` | public | superproject: launcher, PLAN, CONTEXT, BACKLOG, gitlinks |
| `dsh-credentials` | public | account/credential manager (v2 = full vault parity port) |
| `dsh-dialects` | public | provider wire dialects (shipped + boot-verified) |
| `dsh-providers` | public | LLM provider adapters (shipped + boot-verified) |
| `dsh-tweaks` | public | state-folder (homeRoot) + command config (shipped + boot-verified); v2 shipped: share links, observability verbs, session UX |
| `dsh-subscriptions` | **private** | profile bundle: single-seat subscription remap (shipped + boot-verified) |
| `dsh-tui` | public | scaffolded (P1); client-only TUI (cannibalized opencode client), impl later |
| `dsh-desktop` | public | scaffolded (P1); Tauri v2 thin shell + lifecycle plugin |
| `dsh-themes` | public | scaffolded (P1); VS Code/TextMate themes + marketplace catalog |
| `dsh-formatters` | public | scaffolded (P1); LSP-based format-on-edit (greenfield formatDocument) |
| `dsh-tools` | public | scaffolded (P1); config-file custom tools |
| `dsh-agents` | public | scaffolded (P1); custom agent files (JSON/MD) |
| `dsh-repos` | public | scaffolded (P1); repo workflows (PR/commit), consuming GitHub credentials |

`harness` remains a pinned submodule of `deepseek-ai/deepseek-harness`, kept pristine.

## The mapping (harness plugin -> Andromeda original)

| Harness plugin | Status | Andromeda original (removed as progress marker) |
|---|---|---|
| `dsh-dialects` | shipped + boot-verified | `src/server/inference/**` |
| `dsh-credentials` | v2 shipped + boot-verified | `src/vault/**`, `src/cli/secrets.ts`, `src/server/gateway/providers/credentials.ts` |
| `dsh-providers` | shipped + boot-verified | `src/server/gateway/providers/**`, provider-CLI home + adapters in `src/cli/**` |
| `dsh-tweaks` | shipped + boot-verified (v2 shipped) | `src/cli/state*.ts` — partial; rest stays as port-source |
| `dsh-subscriptions` | shipped + boot-verified | `gateway/providers/{routing,accounts}.ts` |

Deferred (future plugin candidates, kept as port-source): `src/cli/orchestrator.ts`
(baton/heartbeat), `src/cli/memory.ts` (durable memory), `src/cli/state*.ts`.

## Dependency policy

No zod. The ported `record.ts`/`descriptor.ts` validation code translates to
`@deepseek-ai/schemastery` (already a plugin dep) via a thin `vault/zod.ts`
compat shim that reproduces the behaviors Andromeda relies on:
- `strictObject` rejects unknown keys (schemastery strips by default)
- `safeParse` aggregates every failing path (schemastery throws on the first)
- `enum`/`refine`/`regex` map to `union`/`pattern` plus a custom registered
  `refine` schema type (schemastery transform callbacks receive no options, so
  refinement is a registered type whose resolver does receive the threaded path)

## P6: dsh-credentials v2 — full vault parity port [complete]

Port Andromeda `src/vault/` module-for-module into the plugin, on the shim:

- **P6a core**: `zod.ts` (shim), `secret.ts` (SecretValue), `credentials.ts`
  (ProviderCredential + CredentialStore types), `record.ts` (9 `SECRET_TYPES`,
  scope, metadata, typed material, rotate/isExpired/effectiveExpiry, codecs),
  `files.ts` (0600 atomic writes), `masterkey.ts` (Static/Passphrase-scrypt/
  KeyFile sources; `Bun.file()` -> node `fs`), `totp.ts` (RFC 6238 + otpauth),
  `store.ts` (EncryptedFileVault, MemoryVault, VaultCredentialStore).
- **P6b supervision**: `oauth.ts` (PKCE/device/refresher, ported in),
  `descriptor.ts` (OAuth config types), `provider-descriptor.ts` (injected
  adapter over dsh-providers `PROVIDER_ROUTES`), `supervisor.ts`
  (classifyAuthFailure, planReauth, ReauthSupervisor), `agent.ts`
  (PrivilegedVaultCustodian + audit), `index.ts` barrel.
- **P6c surface**: `tools.ts` (detector registry, VaultToolset), `cli.ts`
  (owner surface: init/add/import-totp/list/get/totp/status/scan with the
  invariants: no secret on argv, `--reveal` is the only door, otherwise
  fingerprints, scan read-only unless `--import`).
- **P6d accounts**: named accounts on vault records, backward-compat
  `resolve(ref)`, importers wired to real refs (`CLAUDE_SUB_OAUTH_TOKEN`,
  `CURSOR_SUB_TOKEN`, `GROK_SUB_OAUTH_TOKEN`, `GEMINI_SUB_COOKIE_*`,
  `KIMI_SUB_OAUTH_TOKEN`, `KIMI_API_KEY`).
- **P6e command**: `bin/accounts.mjs` + `scripts/dsh` `accounts` verb route.
  Harness untouched.
- **P6f/g evidence**: `check-plugin.mjs` (v1->v2 migration, 9-type round-trips,
  TOTP vector, key-file + passphrase keys, scope denial, audit, importers,
  `resolve()` compat, argv/fingerprint via io seam) + parity mirror of
  Andromeda's vault tests + real-boot witness (`dsh accounts` and
  dsh-providers `resolve()` read the same vault).

## Decommission — executed (evidence passed on c23be1b; Andromeda c6d8cda)

Delete the ported surface; breakage is accepted:
- `src/vault/**`, `src/server/inference/**`, `src/server/gateway/providers/**`,
  `src/server/runtime/**`
- Ported `src/cli` files (secrets, provider-registry, providers, adapters,
  session-adapters, kimi-acp, registry, context, inventory, import, activate,
  cleanup, status, trash, index)
- Dead weight: `src/harness/**` stubs, ~40 tests, `scripts/{verify-codegen*,
  spike/*, verify-single-product.mjs}`, `package.json` bin, `tsconfig.check.json`

Keep: app shell + tRPC server + routers + `apps/*` + `src/cli/{orchestrator,
memory,state*}.ts` as port-source. `cli.ts`/`app.ts`/session capture are left
broken — replaced by `dsh`.

## P7+ roadmap — opencode-parity buildout

Decided 2026-08-14 (session 4 grill). Phase 0 is the planning/documentation round;
phases 1–7 are the build order for subsequent rounds. Full delta + per-plugin
mapping lives in `BACKLOG.md`.

### Phase 0 — repo docs sync [complete]

`AGENTS.md` created (conventions, commit cadence, doc-sync rule); PLAN.md/CONTEXT.md/
BACKLOG.md updated with this roadmap.

### Phase 1 — scaffold 7 new plugin repos [complete]

`dsh-tui`, `dsh-desktop`, `dsh-themes`, `dsh-formatters`, `dsh-tools`, `dsh-agents`,
`dsh-repos` — public repos under `marius-patrik`, git submodules of `agents`, empty
plugin scaffold + PLAN entry. No full implementation this phase.

### Phase 2 — `dsh-tweaks` v2: share + observability + session UX `[complete]`

- **Share links:** self-hosted `/share/:id` read-only snapshot (rendered from
  `session-log-export`), opt-in per session; interactive mode opt-in, gated by
  random token in the URL. Works over Tailscale. **Shipped** (src/share.ts):
  prefix route via `webServer.register`, zstd log read (`node:zlib`), token gate.
- **Observability:** `dsh stats` / `dsh sessions` CLI verbs reading the native
  `session-stats` projection cache (`storages/session_projcache.json`).
  **Shipped** (src/stats.ts + bin/stats.mjs, bin/sessions.mjs).
- **Session UX (wire existing seams):** Plan/Build toggle (`/build` →
  `ctx.planMode.set`, complementing the harness's own `/plan`), fork-based
  `/undo` `/redo` (`ctx.sessions.create`), config-file slash commands
  (`commands` registry bridge), drag-drop images (attachment seam), keybinds
  (greenfield settings surface). **Shipped** (src/session.ts, src/settings.ts).

### Phase 3 — `dsh-desktop`

Tauri v2 thin shell (clean chromeless window, macOS/Win/Linux) + Cordis lifecycle
plugin that spawns `dsh web`, publishes `DSH_WEB_URL`, WebView → `127.0.0.1:3080`.

### Phase 4 — `dsh-themes`

VS Code/TextMate theme support. Sources: (a) **file install** — import local theme
JSON; (b) **catalog** — search + download from a real theme marketplace
(**Open VSX** `open-vsx.org`; public API, no token). Apply via `ui-theme` seam;
`dsh theme` verb + settings surface.

### Phase 5 — `dsh-formatters`

LSP-based format-on-edit (`formatDocument` via `lsp-stdio` seam).

### Phase 6 — partial plugins

- **`dsh-credentials`** (extend): **GitHub credential half** — GitHub OAuth account
  (token in vault, agent-usable `resolve(ref)`), same importers pattern.
- **`dsh-repos`** (narrow): repo workflows only — branch/commit/push/PR, consuming
  GitHub credentials from `dsh-credentials`. No credential storage here.
- **`dsh-tools`:** config-file custom tools (scoped tool registry + `tool-cordis`).
- **`dsh-agents`:** custom agent files (JSON/MD) via `agent-presets`/`persona`.

### Phase 7 — provider catalog breadth (XL, own phase)

Extend `dsh-providers` beyond kimi/claude/cursor/grok/gemini subs.

## Cadence

Commit + push at the end of every phase so progress is visible on GitHub.
