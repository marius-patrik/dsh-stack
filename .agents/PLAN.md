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
| `dsh-credentials` | public | account/credential manager (v2 = full vault parity port); **shipped**: multi-account support (resolveFor/resolveAll, account-tagged records, vault CLI --account, ACCOUNT column) |
| `dsh-dialects` | public | provider wire dialects: openai, claude, gemini, code-assist (shipped + boot-verified) |
| `dsh-providers` | public | LLM provider adapters (shipped + boot-verified); **P7**: 5 sub routes + 8 API-key routes + OpenCode Zen route (`PROVIDER_ROUTES`, `subscription-only`/`all` filter); **P12.1**: absorbs dsh-subscriptions + dsh-quotas; **P12.9 (shipped)**: Unified dynamic filesystem explorer, folder-nested chats, top-level Ungrouped sessions, nested subagent tree hierarchy, file inspection preview, and live sessions manager (`sidebar.workspaces` single-slot shadowing) |
| `dsh-tweaks` | public | state-folder (homeRoot) + command config (shipped + boot-verified); v2 shipped: share links, observability verbs, session UX |
| ~~`dsh-subscriptions`~~ | **archived** | **merged into dsh-providers in P12.1** — remap.ts lives in `dsh-providers/src/remap.ts` |
| `dsh-tui` | public | standalone TUI client for dsh (talks to dsh as backend); separate repo, NOT cannibalizing privatecode; **shipped**: HTTP client + readline TUI + slash commands |
| `dsh-desktop` | public | **P3 shipped**: Tauri v2 thin shell + lifecycle plugin (readiness route, settings) |
| `dsh-themes` | public | **P4 shipped**: VS Code/TextMate theme store + Open VSX catalog + `/themes.json` route + browser theme bundle + `dsh theme` CLI |
| `dsh-formatters` | public | **P5 shipped**: formatter table + `format` tool + auto-format-on-edit + `dsh formatter` CLI |
| `dsh-lsp` | public | **P5 shipped**: LSP server table + `Lsp` def + `lsp-stdio`/`tool-lsp` mounts + `dsh lsp` CLI |
| `dsh-tools` | public | **P6c shipped**: config-file custom tools (settings registry + subprocess execution + `dsh tool` CLI) |
| `dsh-agents` | public | **P6d shipped**: custom agents as JSON/MD persona files materialized into agent presets (`dsh agents` CLI) |
| `dsh-repos` | public | **P6b shipped**: repo workflows — branch/commit/push/PR consuming `GITHUB_OAUTH_TOKEN` (`dsh repos` CLI) |
| `dsh-actions` | public | action controller (renamed from dsh-session-modes in P12.4): durable action state, tool policy, model routing, bounded agent assist, file-based actions under `.agents/actions` |
| `dsh-loops` | public | **P12.8**: goal-based loops from `.agents/loops` — criteria + workflows, deterministic step orchestration, agent tools + settings section |
| ~~`dsh-quotas`~~ | **archived** | **merged into dsh-providers in P12.1** — QuotaRegistry, web routes, auto-refresh, settings section live in `dsh-providers/src/quotas/` |
| `privatecode` | public | opencode fork (subscription providers, OAuth refresh, TUI rendering); kept as-is (works); NOT modified |

All plugins live directly within this single monorepo repository (`dsh-stack`). `harness` remains the sole pinned submodule of `deepseek-ai/deepseek-harness`, kept pristine.

## The mapping (harness plugin -> Andromeda original)

| Harness plugin | Status | Andromeda original (removed as progress marker) |
|---|---|---|
| `dsh-dialects` | shipped + boot-verified | `src/server/inference/**` |
| `dsh-credentials` | v2 shipped + boot-verified | `src/vault/**`, `src/cli/secrets.ts`, `src/server/gateway/providers/credentials.ts` |
| `dsh-providers` | shipped + boot-verified | `src/server/gateway/providers/**`, provider-CLI home + adapters in `src/cli/**` |
| `dsh-tweaks` | shipped + boot-verified (v2 shipped) | `src/cli/state*.ts` — partial; rest stays as port-source |
| `dsh-subscriptions` | shipped + boot-verified | `gateway/providers/{routing,accounts}.ts` |
| `dsh-themes` | shipped + boot-verified | `src/server/websocket/**` theme handling + opencode theme support |

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
  `GROK_SUB_OAUTH_TOKEN`, `GEMINI_SUB_OAUTH_TOKEN` (Code Assist bearer; the
  cookie importers were removed with the consumer-web transport),
  `KIMI_SUB_OAUTH_TOKEN`, `KIMI_API_KEY`; `CURSOR_SUB_TOKEN` removed with
  `cursor-sub`).
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

### Phase 3 — `dsh-desktop` `[complete]`

Tauri v2 thin shell (macOS/Win/Linux) + Cordis lifecycle plugin. The shell
(`src-tauri/`: Tauri 2 Rust, `webui/index.html` stub) opens a window that polls
the plugin's readiness route then redirects the WebView to `dsh web`. The
plugin (`src/lifecycle.ts`, `src/index.ts`) mounts `GET /__dsh-desktop/health`,
publishes the boot URL (`host`/`port` via `dsh-desktop` settings namespace,
defaults `127.0.0.1:3080`), and exposes `spawnWebServer`/`waitForServer`/
`probeServer`/`isAlive` lifecycle helpers. **Shipped** (commit `a20d758`):
`cargo check` clean, `check-plugin.mjs` exercises route + lifecycle against real
local servers, web profile mounts the bundle patch and the health route returns
`{"ok":true,...}` (HTTP 200).

### Phase 4 — `dsh-themes` `[complete]`

VS Code/TextMate theme support. Sources: (a) **file install** — import local theme
JSON; (b) **catalog** — search + download from a real theme marketplace
(**Open VSX** `open-vsx.org`; public API, no token). Apply via `ui-theme` seam;
`dsh theme` verb + settings surface.

Shipped + boot-verified: node half (store under `~/.agents/themes`, catalog
search/extract, `/themes.json` route, `dsh theme` CLI verbs list/search/install/
install-vsix/set/remove), browser half (hand-authored `__ModuleLoader__` bundle
`client.js` registered through the web profile, maps each theme to the 13
`--dsw-alias-*` tokens then `theme.setTheme(active)`), web-profile wiring
(`dsh-themes` bundle + cordis patch row), boot-verified against the live web
profile (boot manifest client row, bundle served, real Open VSX search/install,
CLI→route round-trip).

### Phase 5 — `dsh-formatters` + `dsh-lsp`  `[complete]`

- **`dsh-lsp`** — LSP server table for the harness LSP seam: `dsh-lsp`
  settings section (per-extension `LspLocalServerConfig` entries), `mergeServers`
  (entry-config baseline, settings win), mounts the `Lsp` service definition
  always and `lsp-stdio` + `tool-lsp` only when the merged table is non-empty
  (boot-time composition), `dsh lsp list|servers add|servers remove` CLI.
  Greenfield — no `formatDocument` (the harness LSP op set is
  goToDefinition/findReferences/goToImplementation/hover).
- **`dsh-formatters`** — per-extension formatter commands with a model-facing
  `format` tool and optional auto-format-on-edit: `dsh-formatters` settings
  section (formatter table + toggle), `formatFile` runs formatters through
  `ctx.subprocess` (cwd = file dir, 15s grace, stderr surfaced), the
  `tools/post-execute` waterfall rewrites formatted `edit`/`write` results and
  prepends an `[auto-format]` context note, `dsh formatter
  list|add|remove|set-auto` CLI.
- Both shipped + boot-verified against the live web profile (active Loader
  entries, `dsh lsp`/`dsh formatter` verbs through `scripts/dsh`), committed +
  pushed (`dsh-lsp` f25b21e→682c730, `dsh-formatters` 2eed54a→fb33604), pinned
  in the superproject, wired into the web profile bundle list.

### Phase 6 — partial plugins `[complete]`

- **`dsh-credentials`** (extend): **GitHub credential half** — GitHub OAuth account
  (token in vault, agent-usable `resolve(ref)`), same importers pattern.
  **P6a GitHub half `[complete]`** (2026-08-15): canonical `github` refs +
  `canonicalRefsForPurpose`, `gh` `hosts.yml` file importer, `github` provider
  route + OAuth PKCE refresh supplement (gated on configured client id), all
  boot-verified.
- **`dsh-repos`** (narrow): repo workflows only — branch/commit/push/PR, consuming
  GitHub credentials from `dsh-credentials`. No credential storage here.
  **P6b `[complete]`** (2026-08-15): `repo-status/branch/commit/push/pr` tools
  over `ctx.subprocess` (never shell), token via vault `GITHUB_OAUTH_TOKEN` then
  env fallback, push via `-c http.extraHeader`, PR via the GitHub REST API,
  `dsh repos list|set|status|branch|commit` CLI — all boot-verified against real
  git and a local HTTP server.
- **`dsh-tools`:** config-file custom tools.
  **P6c `[complete]`** (2026-08-15): `dsh-tools.tools` map of name → definition
  (description, parameter schema, argv), each registered as a `ctx.tools` entry
  via `defineTool` and run through `ctx.subprocess` with `{name}` placeholder
  substitution, `dsh tool list|add|remove` CLI — boot-verified with real
  subprocess round-trips.
- **`dsh-agents`:** custom agent files (JSON/MD) via `agent-presets`/`persona`.
  **P6d `[complete]`** (2026-08-15): persona files (MD frontmatter + body, or
  JSON) under the authoring root materialize as agent presets — base preset
  composition spliced verbatim (persona row swapped, `!!js` dialect preserved)
  under the harness user preset root, picker metadata, source-marker pruning,
  boot/watch sync + `dsh agents list|add|remove|sync` CLI — boot-verified against
  the real `standard` composition and the live roster semantics.

### Phase 7 — provider catalog breadth (XL, own phase) `[complete]`

**P7 `[complete]`** (2026-08-15): extended `dsh-providers`' `PROVIDER_ROUTES`
beyond the six subscription adapters (kimi-code, kimi-sub, claude-sub,
cursor-sub, grok-sub, gemini-sub) with eight billable API-key routes —
`openai-api`, `anthropic-api`, `gemini-api` (Generative Language OpenAI-compat
endpoint), `grok-api`, `deepseek-api`, `mistral-api`, `groq-api`, `openrouter-api`
(proxy) — each with advisory model catalogs/context windows. Route count 6 → 14.
The `subscription-only` filter keeps API routes hidden/refused by default;
`mode: "all"` offers them. Boot-verified: filter gate, catalog in all mode, real
openai/claude dialect stream round-trips, missing-credential path. Committed +
pushed (`dsh-providers` da80f8f→3062793), pinned in the superproject.

**Post-P7 wire-truth fix** (2026-08-16): the subscription descriptors were
corrected against the live endpoints — `kimi-sub` speaks the openai dialect at
`api.kimi.com/coding/v1`; `grok-sub` speaks openai at `cli-chat-proxy.grok.com/v1`
with identity headers; `claude-sub` sends `anthropic-beta: oauth-2025-04-20` and
the 5s model family; `gemini-sub` moved from consumer-web cookies to the Code
Assist `v1internal` OAuth transport (new `code-assist` dialect: wrapped
`{model, project, user_prompt_id, request}` body, `{traceId, response}` SSE
unwrap); `cursor-sub` dropped (unreachable Connect-RPC endpoint). 14 → 13 routes.
 Boot-verified (grok identity headers, code-assist wrap/unwrap round-trip).

**Post-P7 token-refresh seams** (2026-08-16): subscription OAuth tokens are
short-lived (kimi ~15 min, gemini 1 h, grok/claude a few hours), so every
subscription loader now refreshes on expiry through the provider's verified
refresh endpoint and persists the rotated bundle. `dsh-providers` stores per
provider access + refresh + expiry in the account vault (`KIMI_SUB_REFRESH_TOKEN`,
`..._EXPIRES`, etc.) and refreshes in `resolveAuth` with singleflight + write-back
via `accounts.set`. The privatecode plugin does the same against `auth.json`
(`{type:"oauth"}` entries) with singleflight + serialized writes. Reverse-
engineered + live-verified endpoints: kimi `auth.kimi.com/api/oauth/token`
(client `17e5f671-…`), claude `api.anthropic.com/v1/oauth/token` (JSON, client
`9d1c250a-…`), grok `auth.x.ai/oauth2/token` (client `b1a00492-…`), gemini
`oauth2.googleapis.com/token`. kimi/grok/claude refresh tokens ROTATE (single
use); gemini's is durable. Live E2E: kimi + gemini refresh, rotation, and
write-back verified in both stacks. grok/claude stashes were consumed during
probing — one-time interactive re-login (`grok login`, `claude /login`) needed
before their seams have live material again.

### Phase 8 — `dsh-session-modes` `[in progress]`

Implement explicit per-session modes over the harness agent seams: durable
`session-mode/selected` state with pending acceptance at `agent/pre-step`, a
`/mode` command, mode policy prompt section, executor-level tool allowlists via
`tools/pre-execute`, optional result substitution via `tools/execute`,
per-mode provider/model routing via `agent/request`, and bounded one-shot
subagent assistance. The plugin must remain agent-scoped for session state and
use isolated preset composition for per-agent services. Boot verification will
exercise state transitions, denied tools, routing, and depth-bounded delegation.

Execution order: finish the durable kernel first, then add the isolated preset
row and bounded subagent tool. Do not make mode state prompt-only or treat
`tools.restrict()` as authorization. The mode set is `tool`, `search`, `action`,
`plan`, `agent`, `shell`, and `code`; `plan` delegates its planning behavior to
the native `ctx.planMode` seam rather than duplicating plan state. The settings
nav rename to "Session Modes" (label swap on `id:'agent-presets'`) lands in
Phase 11; modes stay independent of personas (any × any).

### Phase 9 — `dsh-quotas` `[planned]`

Add a provider-neutral quota snapshot service and settings section displayed
below Models. Each provider adapter is isolated and best-effort: reverse
engineered HTTP usage/quota endpoints may be used only when their response
shape and authentication are understood, while CLI/subscription providers are
represented by planned adapters and later CLI probes. The settings view must
show freshness, window/reset, used/remaining values, and an explicit unknown
state rather than inventing a quota. Start with read-only snapshots, cached
with timestamps, and never log credential material.

### Phase 10 — `dsh-credentials` Keychain/provider binding `[in progress]`

The credential manager's web surface is a Settings section named Keychain, not
a sidebar application page. It must represent the vault's typed records
(`api_key`, OAuth token, password, TOTP seed, passkey, cookie jar, recovery
codes, SSH key, and generic note) with purpose/account metadata and safe reveal
actions. Provider configuration stores a credential reference, not material.
The Models↔Keychain binding (a `Manage in Keychain` action per provider row and
removal of inline key fields) is delivered in Phase 11 via the abstraction
layer's `settings.models.row` seat + `openSection` affordance — never by
patching the harness or using DOM mutation (see `BLOCKED.md` #1).

### Phase 11 — the harness extension layer (Option A) `[in progress]`

**Rule change (2026-08-16):** the harness stays pinned and pristine — no forks,
no source edits — but `dsh-tweaks` becomes the single owned abstraction through
which every other plugin modifies the web UI. Full product scope lives in
`PRD.md`; the seam-by-seam audit lives in `BLOCKED.md`.

Mechanism: the web profile's patch layer (`disable + insert` rows, the harness's
own endorsed composition model) disables harness UI occupants and mounts
dsh-tweaks replacements. Because a slot key has one declarer (`children =
declaration + authorization`), taking over the `sidebar` seat means dsh-tweaks
re-declares the whole subtree and registers `TweaksSidebarRoot`,
`TweaksWorkspaceBrowser`, and `TweaksSettingsRoot` (replacing the ui-sidebar /
ui-workspace / ui-settings-general occupants). New seams declared by the
replacements:

- `sidebar.newSession` — New Chat icon (clipboard-with-pen);
- `sidebar.history` — History section below Workspaces (full history incl.
  machine-root, collapsible);
- `settings.section.icon` — per-section nav glyphs registered by name
  (keychain / meter-bar / plug-in-socket ship in the owning plugins' client
  bundles; dsh-tweaks owns the name→glyph map);
- `settings.models.row` — per-provider Keychain action (`{ only: provider }`,
  mirroring `settings.plugins.tab`), plus `openSection` passed to every section.

Settings nav order becomes General (0) → Models (10) → Quotas (15) → Session
Modes (20) → Agents (25) → Themes (30) → Keychain (35) → Plugins (40).

The one backend exception: pushing `persona/selected` live needs the harness
`API_REMOTE_FORWARDED_EVENTS` allowlist, so the **client folds persona state
from `session.history`** instead (`BLOCKED.md` #3, unblocks).

Phases (detail in `PRD.md` §9): **A** abstraction foundation (occupant shells +
profile patch rows) → **B** icon abstraction + settings reorder + Session Modes
rename + Agents/Themes tabs → **C** live personas (`persona/selected`,
`PersonaController`, `persona:policy` prompt hook, `/persona`, input-bar
switcher, client fold) → **D** Keychain↔Models binding + `/vault?ref=`
deep-link → **E** sidebar batch (History, machine-root, chevrons, collapsed
toggles) → **F** quotas polish + icon.

**Phase A shipped (2026-08-16, boot-verified):** `dsh-tweaks` carries a
`dsh.client` manifest (`platform: web`, `inject: slots/locale/layout/
workspaces/connection`, `exports["./client"]` = the hand-authored `client.js`,
plus `exports["./package.json"]` so the host module registry can read the
declaration) and the take-over bundle: `TweaksSidebarRoot` / `TweaksSettingsRoot`
occupants, chrome re-registration (trigger/header/close/general/action), the
`sidebar.newSession` / `sidebar.history` / `settings.section.icon` seats, the
loopback-only `open-document` action, and the `sidebar` + `settings`
dictionaries. The web profile patch disables `ui-sidebar` and
`ui-settings-general`; the boot manifest now lists the `dsh-tweaks` client row
with its inject edges and serves `/plugins/dsh-tweaks/client.js` (verified
materializing against the real platform seed modules).

**Phase B shipped (2026-08-16, boot-verified):** the settings nav is now
General (0) → Models (10) → Quotas (15) → Session Modes (20) → Agents (25) →
Themes (30) → Keychain (35) → Plugins (40), and every row resolves its glyph
through the `settings.section.icon` seat keyed by section id. Plugin-owned
sections register their own glyph (dsh-quotas 15 + `IconDataOutline16`,
dsh-session-modes 20 + `IconListPenOutline16`, dsh-agents 25 +
`IconGoalOutline16`, dsh-themes 30 + `IconLightOutline16`, dsh-credentials 35 +
`IconApiOutline14`); dsh-tweaks registers the three harness-section glyphs
(models / plugins / agent-presets) and keeps the name→glyph fallback map. Three
full tabs land in the owning plugins' bundles: **Session Modes** (roster over
the node half's new `/session-modes` route — mode vocabulary, default, per-mode
route/tool policies), **Agents** (live preset roster over
`connection.api.agentPresets.list`, so persona files materialized by the
dsh-agents node half show up without a restart), and **Themes** (live switcher
over `ctx.theme`, bound through a `themeSnapshot` observable). The host boot
manifest now carries all six plugin client rows with correct inject edges
(dsh-themes `['slots','theme']`, dsh-agents `['slots','connection']`, etc.) and
all six bundles materialize against the real seed modules.

**Phase C shipped (2026-08-16, tsc clean + check-plugin green):** live personas.
dsh-agents now mirrors the harness's plan-mode pattern end-to-end: a durable
`persona/selected` session-log event, a `PersonaController` with queued/committed/
cancelled/noop semantics, a `persona:policy` prompt section (order 45) that
resolves the active persona from the runtime catalog via
`personaPolicyText(live → header → default → '')`, a `persona` projection unit
(wire: `{ personaId, pending }`, folds `command/run` → pending, `persona/selected`
→ committed), and a `/persona` command (no-arg reports, set switches). The
neutral composition row (`text: ''`) ensures no preset-embedded persona text
bleeds through; persona text lives only in the policy section. Client half
grows to inject `['slots','connection','commandUi','sessions','remote']` with
a display-only `PersonaChip` badge in `conversation.input.left` (reads
`useProjection('persona')`, `nameFor` resolves from a cached roster) and a
`/persona` popupSelect switcher (via `commandUi.register`, options from
`connection.api.agentPresets.list`, active from `sessions.get().projections`,
onSelect → `ctx.remote.commands.execute`). A pre-existing `extensionOf` bug in
`catalog.ts` (`'md'` vs `'.md'`) was caught and fixed.

## Remaining open work (documented plans, no open-ended rows)

The P7+ roadmap is now fully dispatched. The still-OPEN backlog rows each have
a written decision/plan; nothing is left open-ended.

- **TUI default profile (row 2)** — deferred by decision, not blocked. The web
  profile is the shipped default; `dsh-tui` keeps its P1 scaffold (client-only
  TUI cannibalized from opencode). Revisit only when a keyboard-first experience
  is actually wanted; the harness server model already makes the TUI a thin
  client with no new backend seams needed.
- **Curated model gateway (row 3)** — product decision, not a plugin: a
  Zen-analog hosted gateway is out of scope for this stack. Tracked as a
  product item, not backlog.
- **Hosted gateway remainder (row 4)** — the single-seat subscription remap is
  shipped (`dsh-subscriptions`); the multi-tenant hosted gateway is a product
  item with no plugin work planned.
- **GitLab integration (row 8)** — planned for `dsh-repos` (later), same shape
  as the shipped GitHub half: credentials via `dsh-credentials` (`GITLAB_TOKEN`
  slot + GitLab importer), repo tools over `ctx.subprocess`/REST (MRs + merge
  paths). No blocking dependency; scheduled when `dsh-repos` gets its next
  feature round.
- **Agentic init → AGENTS.md (row 9)** — planned for `dsh-repos` (later): a
  `dsh repos init` tool that reads repo state and writes a harness-flavored
  `AGENTS.md` (conventions, plugin seams, boot-verify commands). Currently dsh
  only reads AGENTS.md; generation is a small additive tool, no new seams.
- **GA stability (row 21)** — remains OPEN by design: harness is a dev
  preview, breaking changes expected, harness kept pinned and bumped only
  deliberately.



## P12 — Session 16 buildout (2026-08-17) `[in progress]`

Source: `.agents/requests/session-16-providers-overhaul-loops-zen.md`. Supersedes
the Session-14 gates. Ten work items grouped into ten phases; each phase ships
docs-synced commits (plugin repo first, then the superproject pin).

### Design decisions

1. **Providers consolidation (P12.1).** `dsh-subscriptions` and `dsh-quotas` fold
   into `dsh-providers` as modules (`src/subscriptions.ts`, `src/quotas/*` —
   registry, snapshot store, `/quotas/api/*` routes, HTML dashboard, probe
   providers incl. the uncommitted Session-15 work). One plugin owns provider
   routes + auth state + quota state. The two retired repos stay on GitHub with an
   archive notice; superproject submodules are removed after the pin moves.
   Web profile: `dsh-subscriptions`/`dsh-quotas` rows removed, `dsh-providers`
   carries the merged client bundle.
2. **OpenCode Zen (P12.1).** New `zen` provider route in dsh-providers:
   `opencode.ai/zen` gateway — OpenAI-compatible wire (openai dialect), API-key
   auth stored in the vault (`ZEN_API_KEY` / OAuth if the live endpoint proves
   out), model catalog from the zen models endpoint, quota probe adapter in the
   merged quotas module. Wire-truth first: probe the real endpoints, record the
   evidence in the plugin's check-plugin and CONTEXT.md.
3. **Providers settings UI (P12.2).** The harness `ui-settings-models` occupant
   is replaced the same way `ui-settings-general` was (profile disable+insert,
   dsh-tweaks declares the seat, dsh-providers registers the `Providers`
   section): provider rows show auth state (credential present/valid/expired),
   subscription vs API badge, and quota meter from the merged quotas registry.
   Quotas tab (order 15) is removed; Models tab renamed `Providers`.
4. **Keychain overhaul (P12.3).** Full settings section (own nav row, correct
   key glyph) replacing the embedded page: typed-record list grouped by
   purpose/account, add/edit/remove, fingerprint-first reveal, expiry display,
   provider bindings. All over the existing `/vault/*` routes, extended as
   needed.
5. **Actions rename (P12.4).** `dsh-session-modes` → `dsh-actions`: GitHub repo
   rename, package name, plugin `name`, routes (`/actions`), client bundle,
   profile wiring, docs. Action definitions become file-based under
   `.agents/actions` (MD/JSON, same catalog/sync pattern as dsh-agents persona
   files) layered over the built-in mode set; the settings tab is renamed
   `Actions`.
6. **Agents tab + presets split (P12.5).** Harness `agent-presets` section is
   relabeled `Agents`; agent/persona presets roster lives in the dsh-agents tab;
   action/mode presets live in the Actions tab. Both tabs become full management
   surfaces (list/enable/edit-source), not read-only teasers.
7. **Themes catalog (P12.6).** Themes tab gains the Open VSX catalog pane
   (search → install → apply) over the shipped `/themes.json` route + CLI
   backend, next to the installed-themes switcher.
8. **Tools settings (P12.7).** dsh-tools registers a settings section listing
   both harness built-in tools (enable/disable policy where the seam allows) and
   config-file custom tools (full CRUD over the `dsh-tools.tools` map).
9. **dsh-loops (P12.8).** New plugin + repo. Loop files under `.agents/loops`
   (MD/JSON): goal, completion criteria, workflow steps; deterministic
   orchestration = declarative step sequences with fixed tool/prompt bindings
   executed without free-form planning where declared. Agent tools
   (`loop list/create/edit/run/stop/status`) + a settings section editing the
   same files.
10. **Plugin enable/disable (P12.9).** dsh-tweaks Plugins section: toggle per
    plugin writes the profile enable state, modal popup "takes effect on reload"
    with a Reload button (`location.reload()`).

### Phase order

P12.0 housekeeping (verify + commit the pending dsh-quotas probe-providers work)
→ P12.1 providers merge + zen → P12.2 Providers UI → P12.3 Keychain → P12.4
Actions rename + .agents/actions → P12.5 Agents tab → P12.6 Themes catalog →
P12.7 Tools settings → P12.8 dsh-loops → P12.9 enable/disable + reload.

## Cadence

Commit + push at the end of every phase so progress is visible on GitHub.

## Session 15 infrastructure (2026-08-17)

- **Harness web server 400 error resolved:** directory rename from `~/agents` to
  `~/projects/dsh-stack` broke all symlinks (profile node_modules, per-plugin peer
  deps). Fixed by re-pointing all symlinks, updating profile package.json, adding
  missing flat fallback entries, and creating per-plugin `node_modules/@deepseek-ai/`
  symlinks. Verified: HTTP 200 at `http://127.0.0.1:3080/`.

- **agents-super restructure complete:** all 16 dsh- plugin repos as submodules under
  `dsh/`, privatecode at root, paes + ams under `apps/` (private), darkfactory
  public. Committed `ca1cd09`.

- **External state cleanup:** deleted `.dsh` (stale), `.gemini` (155M), `.grok` (177M),
  `.kimi` (646M). All credentials already in dsh vault. `.claude` kept (opencode
  agent CLI).

- **Andromeda session conversion:** 405 andromeda transcripts converted to dsh
  `.jsonl.zstd` format at `~/.agents/sessions/andromeda-*/`.

- **Request file backfill:** 16 request files in `.agents/requests/` covering all DSH
  session history (CONTEXT.md sessions 1-14 + current session).

## P13 — the great consolidation (agreed 2026-08-18, user + K3 planning round)

**Amendment (same round): dsh-agents also folds into dsh-tweaks** — personas,
preset materialization (.agents files), the Agents tab, and live persona state
become tweaks modules. Final count: 7 plugins.

**Amendment 2 (same round): dsh-themes and dsh-voice also fold into dsh-tweaks,
and dsh-desktop is DELETED** (no Tauri shell in the end-state). Final count: 4
plugins — `dsh-integrations`, `dsh-tweaks`, `dsh-code`, `dsh-tui`.

**Amendment 3 (settings IA):** the Models/Keychain/Quotas merge is named
**Integrations** (matching the plugin), not "Providers".

**Amendment 4 (provider display names + row badges):** every model row shows
its seat — `(Sub)` or `(API)`. Canonical names: kimi-sub = **Kimi Code**,
kimi api = **Kimi Console**; claude-sub = **Claude Code**, anthropic api =
**Anthropic Console**; deepseek api = **DeepSeek Console**; gemini-sub =
**Antigravity**, gemini api = **Google Cloud**; grok-sub = **Grok Build**;
zen = **OpenCode Zen**; go = **OpenCode Go**; chatgpt sub = **Codex/ChatGPT**.

**Amendment 5 (new provider):** ChatGPT-subscription **Codex** provider with
full parity — login flow, model list, probes, quotas, token refresh, effort
levels (reasoning effort is a Codex-native knob).

**Decisions taken with the user:** credentials merge FULLY into the providers
plugin; the final plugin is named **dsh-integrations** via GitHub rename of
dsh-providers (history/redirects preserved); TUI base leaning opentui, NOT
locked.

### End-state plugin map (7 plugins)

| Plugin | Contents | Absorbs (archived) |
|---|---|---|
| `dsh-integrations` | provider routes (zen, go, 5 sub, 8 api), wire dialects, quota registry + probes, subscription remap, **the vault + Keychain + login flows**, translator | dsh-providers (renamed), dsh-dialects, dsh-subscriptions ✅, dsh-quotas ✅, dsh-credentials, dsh-translator |
| `dsh-tweaks` | extension layer, share/stats/session-UX, keybinds, slash commands, **actions (.agents/actions + reload actions), custom tools, loops (.agents/loops), agents/personas + the Agents tab** | dsh-actions, dsh-tools, dsh-loops, dsh-agents |
| `dsh-code` (new) | formatters, LSP server table, repo workflows (GitHub/GitLab) | dsh-formatters, dsh-lsp, dsh-repos |
| `dsh-themes` | ALL appearance: VS Code themes only, default dark+light pair, Open VSX catalogue | (harness ui-theme occupant, replaced) |
| `dsh-voice` | browser STT + human TTS via vault creds | — |
| `dsh-desktop` | Tauri shell | — |
| `dsh-tui` | own TUI, fully dsh-integrated (base: likely opentui, unlocked) | privatecode as TUI base |

### Settings IA end-state

General (no Appearance) → **Providers** (auth + quota + credentials/Keychain
per provider, subscription/API badges) → **Agents** (presets + personas +
actions) → **Themes** (sole appearance surface) → Plugins (+ Tools/Loops
sections owned by tweaks).

### Execution order (gate: Claude settles in providers/credentials/dialects)

1. Verify all providers truly work (probe-live.mjs against the real vault).
2. Land in-flight P12 subagent work (themes/tools/loops/actions/agents/voice).
3. P13a rename dsh-providers → dsh-integrations (GitHub, code, profile).
4. P13b fold credentials → integrations (vault, logins, Keychain UI →
   Providers tab).
5. P13c fold dialects + translator → integrations.
6. P13d fold actions + tools + loops → tweaks.
7. P13e create dsh-code ← formatters + lsp + repos.
8. P13f settings IA final (appearance port, Agents tab merge, nav).
9. P13g archive retired repos, profile cleanup, docs/PRD promotion.

## P14 — UI Polish, Unified Panel Tabs, and Menus (Session 20) [complete]

1. **Input bar plus button**: Center vertically in `.inputRow` and size to 34px circle matching the send button.
2. **Message preview text**: Vertically center the placeholder / draft text in the composer card.
3. **Panel plus button context menu**: Add unified context menu (New Chat, New Terminal, New Container) to the panel tab bar.
4. **Collapsed sidebar plus button**: Remove new workspace button when sidebar is collapsed; show unified plus button.
5. **Unified panel tabs (full UI)**: Make Conversation a tab in the panel alongside Terminals and Containers, giving full UI multi-tab management.
6. **Remove header preset badge**: Remove preset badge from session header (already displayed in input bar).
7. **Session log export 3-dots menu**: Hide download session log button under a three-dots (`...`) menu.
8. **Goal badge OLED styling**: Apply OLED dark colors to goal bar background and borders.

## P15 — Settings Shell, Mobile Layout, Drag-and-Drop Tabs & Context Menus (Session 22) [complete]

1. **Settings sidebar collapsable & resizable**: Resizable nav rail (`.dsh-tw-nav`) with drag handle and collapse toggle on settings modal.
2. **Mobile sidebar full width**: On screens <= 768px, sidebar expands to full viewport width (`100vw`).
3. **Draggable settings modal**: Enable dragging the settings dialog across the screen by header.
4. **Enhanced context menu**: Cut, Copy, Paste, plus context-aware Close and Rename for sessions and workspaces.
5. **Panel plus dropdown z-index fix**: Ensure dropdown menus render above xterm and sandboxes (`z-index: 10000000` with fixed viewport anchor calculation).
6. **Main conversation top tab bar & cross-panel tab drag**: Top tab bar with plus button, tab switching, and drag-and-drop between top and bottom panels.

## P16 — Sidebar Visuals, Folder/Chat Menus, Centering, Main Tabs & Settings Fix (Session 23) [complete]

1. **Sidebar chat context & 3-dots hover menu**: Right click menu with Rename & Archive; maintain hover 3-dots menu on all chat rows.
2. **Unified sidebar visual system**: Consistent 12px fonts, 30px row heights, and proportional hierarchy indentation across folders, chats, ungrouped, and subagents.
3. **Folder hover 3-dots menu**: Replace terminal button with a 3-dots button next to `+` with focus, terminal, cut, copy path, rename, delete, new chat.
4. **Input bar plus button & draft vertical centering**: Fix vertical alignment in `.inputRow` and composer card.
5. **Main view standalone plus menu**: Opening a Terminal or Container via top tab bar renders directly in the main view area without opening the bottom panel.
6. **Purge top header preset badge**: Ensure preset badge is fully removed from top chrome.
7. **Brand SVG provider icons in settings**: Add SVG logos for all providers in Settings > Providers.
8. **Settings button lifecycle fix**: Fix settings button unmounting / not opening on click.
9. **Cross-panel tab deduplication**: Mutually exclusive tab sets between main view and bottom panel.

## P17 — Header Context Menus, Collapsed Ungrouped, Unified Tabs & Panel Collapse (Session 24) [complete]

1. **Download session log in 3-dots context menu**: Hide standalone export button and place it in a three-dots (`...`) menu in session header actions/utilities.
2. **Ungrouped chats collapsed by default**: Initialize `isUngroupedOpen` to `false` in `UnifiedWorkspacesBrowser`.
3. **Unify panel tabs with top styling**: Restyle bottom panel tab strip using the same pill/capsule design language, font, padding, and active indicators as the top tab bar.
4. **Replace maximize with collapse toggle & remove close button**: Bottom panel header replaces maximize with a collapse/expand toggle and completely removes the close button.
5. **Terminal specialized actions menu & right-click**: Provide Refresh Buffer, Clear Buffer, Rename, Kill, and New Window under tab right-click and trailing 3-dots tab bar menu.

## P18 — Sidebar Search, Input Text Centering, Delete Skills, Settings Fix & Panel Alignment (Session 25) [complete]

1. **Sidebar search input & visibility setting**: Search filter box at top of sidebar with a toggle setting in General settings.
2. **Input bar preview text true vertical centering**: Center text glyphs vertically (fix bottom on centerline).
3. **Delete all Cursor imported skills**: Remove all cursor imported skills from the repository.
4. **Settings button click fix**: Reliable open/trigger of settings dialog from sidebar and all buttons.
5. **Remove duplicate conversation tab from panel**: Only show terminal/containers in panel when chat is in main.
6. **Panel background & edge alignment**: Fix gap behind panel and align edges with sidebar and centerCol.

## P19 — Conversation Content Move with Tab & Auto-Expand Collapsed Panel (Session 26) [complete]

1. **Conversation content moves with tab**: When conversation tab is moved or active in bottom panel, render full conversation content in the bottom panel without arbitrary 38px clamp.
2. **Auto-expand collapsed panel on tab click**: Clicking any tab button in `BottomTerminalPanel` automatically expands the panel if collapsed.

## P20 — Tab Destinations, Right Sidebar, OLED, Terminal Unification & Panel Icon (Session 27) [complete]

1. **Tab context move destinations**: Move to Main Area, Bottom Panel, Left/Right Sidebar in tab menus.
2. **Collapsible Right Sidebar dock**: Add right dock that can host tabs.
3. **Panel OLED black styling**: Respect pure OLED black in tab bar headers and containers.
4. **Main view terminal unification**: Render identical interactive tmux terminal component in main area without fake input bar.
5. **Full conversation DOM/content hosting**: Move real conversation content when tab is moved.
6. **Tab move empty fallback & sequence**: Switch to next tab or empty launcher card when tab moves.
7. **Settings button click fix & Panel Icon**: Reliable settings trigger & panel dock icon (replace chevrons).

## P21 — Repo Icons, Sidebar Alignment, Pinned & Active, Purge Legacy Layouts (Session 28) [complete]

1. **Repo icon detection in sidebar**: Identify git repositories (.git folder or repo metadata) and render git repo icon instead of folder icon.
2. **Sidebar item indentation alignment**: Unify padding and alignment so child items beneath folders line up on the exact same vertical baseline as sibling subfolders.
3. **Rename section to "Pinned & Active"**: Rename "Live Sessions" header to "Pinned & Active".
4. **Purge legacy sidebar layout**: Completely eliminate old sidebar views so clicking a terminal never causes sidebar regressions.

## P22 — Full UI Polish, Settings Split, Secondary Sidebar & Context Menus (Session 29) [in progress]

1. **Settings Button Fix & High Z-Index**: Eliminate double-toggle capture conflict in `TweaksSettingsRoot`, set `z-index: 1000000`.
2. **Accurate Git Repository Detection**: Strictly verify `.git` presence on the filesystem; remove workspace fallback for repo icon.
3. **Sidebar Terminal & Container Click Handlers**: Attach reactive event listeners in `BottomTerminalPanel` to auto-expand and switch views.
4. **Toolbar Model Picker vs Dropdown Menu**: Generic model icon on toolbar trigger button, individual provider brand icons in dropdown options.
5. **Unclosable Conversation Tab**: Omit close button on conversation tabs in top and panel bars.
6. **Split Settings into Accounts, Models, and Apps**: Dedicated sections (Accounts, Models, Apps) with brand icons across all provider rows.
7. **Harmonize Subagent Collapse Style**: Standardize `renderChatRow` slot structure to match folders (`[Icon] [Chevron] [Title] [Count Pill] [Actions]`).
8. **Right-Click Context Menu Parity**: Anchor `SelectDropdownMenu` to `(e.clientX, e.clientY)` with full 3-dots actions.
9. **Secondary Sidebar & Sidebar Swap Setting**: Add sidebar swap toggle in Personalization settings to switch Main Sidebar and Secondary Sidebar sides.
10. **Remove Top Preset Badge**: Permanently suppress `conversation.session.header.actions` preset badges via global CSS & slot filters.


