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
| `agents` | public | superproject: launcher, PLAN, gitlinks |
| `dsh-credentials` | public | account/credential manager (v2 = full vault parity port) |
| `dsh-dialects` | public | provider wire dialects (shipped + boot-verified) |
| `dsh-providers` | public | LLM provider adapters (shipped + boot-verified) |
| `dsh-tweaks` | public | state-folder (homeRoot) + command config (shipped + boot-verified) |
| `dsh-subscriptions` | **private** | profile bundle: single-seat subscription remap (shipped + boot-verified) |

`harness` remains a pinned submodule of `deepseek-ai/deepseek-harness`, kept pristine.

## The mapping (harness plugin -> Andromeda original)

| Harness plugin | Status | Andromeda original (removed as progress marker) |
|---|---|---|
| `dsh-dialects` | shipped + boot-verified | `src/server/inference/**` |
| `dsh-credentials` | v2 shipped + boot-verified | `src/vault/**`, `src/cli/secrets.ts`, `src/server/gateway/providers/credentials.ts` |
| `dsh-providers` | shipped + boot-verified | `src/server/gateway/providers/**`, provider-CLI home + adapters in `src/cli/**` |
| `dsh-tweaks` | shipped + boot-verified | `src/cli/state*.ts` — partial; rest stays as port-source |
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

## Cadence

Commit + push at the end of every phase so progress is visible on GitHub.
