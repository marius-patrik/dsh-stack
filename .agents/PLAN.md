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
| `dsh-providers` | public | LLM provider adapters (shipped + boot-verified); **P7**: 5 sub routes + 8 API-key routes (`PROVIDER_ROUTES`, `subscription-only`/`all` filter) |
| `dsh-tweaks` | public | state-folder (homeRoot) + command config (shipped + boot-verified); v2 shipped: share links, observability verbs, session UX |
| `dsh-subscriptions` | **private** | profile bundle: single-seat subscription remap (shipped + boot-verified) |
| `dsh-tui` | public | standalone TUI client for dsh (talks to dsh as backend); separate repo, NOT cannibalizing privatecode; **shipped**: HTTP client + readline TUI + slash commands |
| `dsh-desktop` | public | **P3 shipped**: Tauri v2 thin shell + lifecycle plugin (readiness route, settings) |
| `dsh-themes` | public | **P4 shipped**: VS Code/TextMate theme store + Open VSX catalog + `/themes.json` route + browser theme bundle + `dsh theme` CLI |
| `dsh-formatters` | public | **P5 shipped**: formatter table + `format` tool + auto-format-on-edit + `dsh formatter` CLI |
| `dsh-lsp` | public | **P5 shipped**: LSP server table + `Lsp` def + `lsp-stdio`/`tool-lsp` mounts + `dsh lsp` CLI |
| `dsh-tools` | public | **P6c shipped**: config-file custom tools (settings registry + subprocess execution + `dsh tool` CLI) |
| `dsh-agents` | public | **P6d shipped**: custom agents as JSON/MD persona files materialized into agent presets (`dsh agents` CLI) |
| `dsh-repos` | public | **P6b shipped**: repo workflows — branch/commit/push/PR consuming `GITHUB_OAUTH_TOKEN` (`dsh repos` CLI) |
| `dsh-session-modes` | public | session mode controller: durable mode state, tool policy, model routing, bounded agent assist; **shipped**: web endpoints for current/history/transitions |
| `dsh-quotas` | public | provider quota/usage aggregation and a settings usage dashboard; **shipped**: HTML dashboard, summary API, per-provider refresh, meter bars |
| `privatecode` | public | opencode fork (subscription providers, OAuth refresh, TUI rendering); kept as-is (works); NOT modified |

`harness` remains a pinned submodule of `deepseek-ai/deepseek-harness`, kept pristine.

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
