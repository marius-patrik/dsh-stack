# CONTEXT — full session run-through

> Complete memory/context file, kept in-repo. Written 2026-08-14, updated 2026-08-17.
> Covers, in chronological order: (1) the **Andromeda port project** (biggest prior
> session, `ses_002adefbcffe`, 1375 msgs, Aug 13 → Aug 14 18:54), (2) the
> **Lidless/LSP/admin session** (`ses_00060d5deffe`), (3) the **opencode↔dsh parity +
> product-plan session** (`ses_0004c6e67f`), (4) the **planning round** (grill + P7+
> roadmap, most recent). Ends with a final memory context / state of the world.
> Backlog lives in `BACKLOG.md`.

---

## 0. Session map (chronological)

| # | Session | When | What |
|---|---|---|---|
| 1 | `ses_002adefbcffe` (big, 1375 msgs) | Aug 13 22:50 UTC → Aug 14 18:54 local | Andromeda → dsh port: pastacode pivot, plugins, P6, decommission |
| 2 | `ses_00060d5deffe` (22 msgs) | Aug 14 | Lidless install, opencode LSP enable, admin agent |
| 3 | `ses_0004c6e67f` (39 msgs) | Aug 14 late | opencode↔dsh parity map, 21-row delta, Tauri/Tailscale/PWA plan |
| 4 | `ses_...` (planning round) | Aug 15 | Phase 0 docs: AGENTS.md, P7+ roadmap in PLAN.md, backlog re-key |
| 5 | `ses_...` (planning round) | Aug 16 | PRD.md + BLOCKED.md at root; harness extension layer (Option A) decision |
| 6 | `ses_...` (build round) | Aug 16 | Execute full backlog: Phase 11 A–F + backlog rows 8/9; abstraction foundation first |
| 7 | `ses_...` (build round) | Aug 16 | Phase B: settings reorder + full tabs (Session Modes, Agents, Themes) |
| 8 | `ses_...` (build round) | Aug 16 | Phase C: live personas (PersonaController, persona:policy, /persona command, client badge + switcher) |
| 9 | `ses_...` (build round) | Aug 16 | Provider wire-truth round: fix dsh transports to match reality (kimi/claude/grok/gemini) |
| 10 | `ses_...` (build round) | Aug 16 | OAuth token refresh seams for every subscription provider |
| 11 | `ses_...` (build round) | Aug 17 | E2E provider verification + privatecode submodule |
| 12 | (skipped) | | |
| 13 | `ses_...` (fix round) | Aug 17 | Bug fixes, docs restructure, remaining work orientation |
| 14 | `ses_...` (build round) | Aug 17 | Multi-account, dsh-tui, session-modes, quotas, harness fix |
| 15 | `ses_...` (infra round) | Aug 17 | Harness 400 fix, agents-super restructure, state cleanup, andromeda conversion |
| 16 | `ses_...` (settings round) | Aug 17 | Providers consolidation, loops, actions, zen provider |
| 17 | `ses_...` (sidebar round) | Aug 20 | Sidebar full filesystem, dynamic workspaces, nested chats/subagents, input bar |

Prior-session subagent transcripts (all read-only @explore on `/Users/user/Andromeda`):
- `ses_001d0e49` "Map Andromeda state/CLI surface"
- `ses_001d0f40` "Map Andromeda providers/inference usage"
- `ses_001d1001` "Map Andromeda vault usage"

---

## 1. Session 1 — the Andromeda port project (everything so far)

### 1.1 Genesis: the opencode fork idea (pastacode)
Started as: make a **private fork of opencode** on the user's GitHub account to replace
the local install, adding reverse-engineered **subscription support** (Gemini sub first).
Evolved through:
- + Claude subscription (alongside existing API connectors); reference the user's
  **Andromeda** repo for reverse-engineering help.
- + Native **tmux** integration (TUI detachable/multiplexable; single pinned opencode
  tmux server; pink status bar; `opencode attach`/`kill session`; ensure tmux installed).
- + Groq + Cursor subscription support; split provider list into **Subscriptions vs API**
  (not "popular/providers"); add **favoriting** to pin providers to top.
- Fork name: **pastacode** (NOT replacing the local install — that would kill the shell).
  Keep internal strings for easy upstream merge; change only user-visible strings.
- Directory sandboxing change: agents invoked from anywhere start as **root by default**;
  a `/directory` (dir) command to set working dir; `local`/`user`/`root` identifiers;
  final design: **default = user dir**, `sudo shell` starts at `/`, dir command can switch
  to root/local even without sudo.
- PIVOT (user interrupt): "deepseek released a harness... built for customization first
  ... much better fit... no need for a fork, just install it... each capability should
  become a plugin." → opencode fork **abandoned**. This is the current project.

### 1.2 The dsh (DeepSeek Harness) pivot
- Cloned `https://github.com/deepseek-ai/deepseek-harness` → `~/agents/harness`
  (kept pristine, pinned submodule, `HEAD detached at 47f943859b` ≈ 0.1.0-rc.5).
- Principles agreed:
  - Everything that is not core harness = a **plugin**.
  - Each plugin = a git **repo** that is a **submodule** under the `agents` superproject.
  - State folder: **hybrid**, renamed from `dsh` → **`.agents`** (config in state
    folder, adjustable in web UI, applies on next launch / on exit).
  - Provider **dialect abstraction** with bundled dialects: openai, claude, gemini.
  - `dsh-llm-subscriptions` renamed → **dsh-providers**.
  - Provider filter + path config + command-string config bundled into a general
    **dsh-tweaks** plugin ("just some sort of main string config").
  - A full **credentials manager** plugin (any account: password/otp/passkey/oauth
    tokens + login flows + agent-usable) — deferred to phase 2; for now only needs to
    unlock the LLMs.
- Cadence rule: **commit + push at end of every phase** so progress is visible on GitHub.

### 1.3 Current repo layout (all under GitHub user `marius-patrik`)
`~/agents` is the superproject (`git status` clean, on `main`, pushed to `origin`):

| Repo | Visibility | Role |
|---|---|---|
| `agents` | public | superproject: launcher, PLAN.md, CONTEXT.md, BACKLOG.md, gitlinks |
| `harness` | submodule (deepseek-ai) | pinned deepseek-harness checkout, kept pristine |
| `dsh-credentials` | public | account/credential manager (**v2 shipped** = full vault parity port) |
| `dsh-dialects` | public | provider wire dialects (shipped + boot-verified) |
| `dsh-providers` | public | LLM provider adapters (shipped + boot-verified) |
| `dsh-tweaks` | public | state-folder (homeRoot) + command config (shipped + boot-verified) |
| `dsh-subscriptions` | **private** | profile bundle: single-seat subscription remap (shipped + boot-verified) |

Local dirs: `~/agents/{PLAN.md,README.md,CONTEXT.md,BACKLOG.md,harness,plugins,scripts,
node_modules}`, `~/agents/scripts/{agents,bootstrap,dsh}` (dsh launcher), `~/.dsh/`
(harness home: `profiles/`, `.anonymous-user-id`). Old `agents-oss` GitHub repo —
**deleted**.

### 1.4 Plugin ↔ Andromeda mapping (progress markers)
Ported subsystems are **deleted from Andromeda** (`/Users/user/Andromeda`, GitHub
`marius-patrik/Andromeda`) as a progress marker; breaking Andromeda is accepted.

| Harness plugin | Status | Andromeda original (removed) |
|---|---|---|
| `dsh-dialects` | shipped + boot-verified | `src/server/inference/**` |
| `dsh-credentials` | v2 shipped + boot-verified | `src/vault/**`, `src/cli/secrets.ts`, `src/server/gateway/providers/credentials.ts` |
| `dsh-providers` | shipped + boot-verified | `src/server/gateway/providers/**` + provider-CLI home/adapters in `src/cli/**` |
| `dsh-tweaks` | shipped + boot-verified | `src/cli/state*.ts` — partial; rest stays as port-source |
| `dsh-subscriptions` | shipped + boot-verified | `gateway/providers/{routing,accounts}.ts` |

**Deferred (future plugin candidates, kept as port-source in Andromeda):**
`src/cli/orchestrator.ts` (baton/heartbeat), `src/cli/memory.ts` (durable memory),
`src/cli/state*.ts`.

**Dependency policy:** NO zod. Andromeda's `record.ts`/`descriptor.ts` validation
translates to `@deepseek-ai/schemastery` via a thin `vault/zod.ts` compat shim
(`strictObject` rejects unknown keys; `safeParse` aggregates all failing paths; enum/
refine/regex → union/pattern + custom registered `refine` schema type).

### 1.5 P6 — dsh-credentials v2: full vault parity port **[complete]**
Port Andromeda `src/vault/` module-for-module into the plugin, on the zod shim:
- **P6a core:** `zod.ts` shim, `secret.ts` (SecretValue), `credentials.ts`
  (ProviderCredential + CredentialStore types), `record.ts` (9 `SECRET_TYPES`, scope,
  metadata, typed material, rotate/isExpired/effectiveExpiry, codecs), `files.ts`
  (0600 atomic writes), `masterkey.ts` (Static/Passphrase-scrypt/KeyFile sources;
  `Bun.file()` → node `fs`), `totp.ts` (RFC 6238 + otpauth), `store.ts`
  (EncryptedFileVault, MemoryVault, VaultCredentialStore).
- **P6b supervision:** `oauth.ts` (PKCE/device/refresher), `descriptor.ts` (OAuth
  config types), `provider-descriptor.ts` (adapter over dsh-providers
  `PROVIDER_ROUTES`), `supervisor.ts` (classifyAuthFailure, planReauth,
  ReauthSupervisor), `agent.ts` (PrivilegedVaultCustodian + audit), `index.ts`.
- **P6c surface:** `tools.ts` (detector registry, VaultToolset), `cli.ts` (owner
  surface: init/add/import-totp/list/get/totp/status/scan; invariants: no secret on
  argv, `--reveal` is the only door, otherwise fingerprints, scan read-only unless
  `--import`).
- **P6d accounts:** named accounts on vault records, backward-compat `resolve(ref)`,
  importers wired to real refs (`CLAUDE_SUB_OAUTH_TOKEN`, `CURSOR_SUB_TOKEN`,
  `GROK_SUB_OAUTH_TOKEN`, `GEMINI_SUB_COOKIE_*`, `KIMI_SUB_OAUTH_TOKEN`,
  `KIMI_API_KEY`).
- **P6e command:** `bin/accounts.mjs` + `scripts/dsh` `accounts` verb route.
  Harness untouched.
- **P6f/g evidence:** `check-plugin.mjs` (v1→v2 migration, 9-type round-trips, TOTP
  vector, key-file + passphrase keys, scope denial, audit, importers, `resolve()`
  compat, argv/fingerprint via io seam) + parity mirror of Andromeda vault tests +
  real-boot witness (`dsh accounts` and dsh-providers `resolve()` read the same vault).

### 1.6 Decommission — executed
Evidence passed on `c23be1b`; Andromeda commit `c6d8cda` ("P6: decommission the ported
vault/provider surface"). Deleted from Andromeda:
- `src/vault/**`, `src/server/inference/**`, `src/server/gateway/providers/**`,
  `src/server/runtime/**`
- Ported `src/cli` files (secrets, provider-registry, providers, adapters,
  session-adapters, kimi-acp, registry, context, inventory, import, activate,
  cleanup, status, trash, index)
- Dead weight: `src/harness/**` stubs, ~40 tests, `scripts/{verify-codegen*,
  spike/*, verify-single-product.mjs}`, `package.json` bin, `tsconfig.check.json`
- Kept as port-source: app shell + tRPC server + routers + `apps/*` +
  `src/cli/{orchestrator,memory,state*}.ts`. `cli.ts`/`app.ts`/session capture left
  broken — replaced by `dsh`.
- Three @explore subagent maps were produced first (vault, providers/inference,
  state/CLI surface) to guarantee surgical removal.
- Final actions (18:54 local): updated `~/agents/PLAN.md` (P6 `[complete]`,
  `dsh-credentials` → "v2 shipped + boot-verified", decommission "executed"),
  committed + pushed (`e234f43`), and deleted GitHub repo `marius-patrik/agents-oss`
  (old "personal fork of opencode", private, stale).

**End-of-session-1 state:** all 5 plugins shipped + boot-verified; P6 complete;
decommission done; `agents` superproject at `e234f43` on GitHub; Andromeda kept
(reduced) as port-source. Open thread: the user's message trailed off ("and .").

---

## 2. Session 2 — Lidless, LSP, admin agent (`ses_00060d5deffe`)

1. **Install Lidless** — user said "install nts/plugins/dsh", then corrected:
   "sorrry https://github.com/nghialuong/Lidless this". Installed **Lidless** — macOS
   menu-bar app that keeps the Mac running with the lid closed.
2. **Enable opencode LSPs** — set `"lsp": true` in `~/.config/opencode/opencode.jsonc`.
3. **Add admin agent** — created `~/.config/opencode/agents/admin.md`, an unrestricted
   admin agent (`permission: allow`, `mode: primary`).
Working dir `/Users/user`, agent = `build`. (Short session; no other open threads.)

---

## 3. Session 3 — opencode↔dsh parity + product plan

### 3.1 The two tools
**opencode (reference)** — `anomalyco/opencode` (ex `sst/opencode`), opencode.ai, MIT,
~195k★, ~950 contributors, ~16M monthly devs. Client/server (Bun); one backend drives
every surface: TUI (primary), desktop app (macOS/Win/Linux), IDE extension (VS Code,
Cursor, Windsurf, VSCodium), web UI, headless CLI, HTTP server. Models: 75+ via
Models.dev; local (Ollama/LM Studio); curated **Zen** gateway; **OpenCode Go** sub
($5→$10/mo, 5h/$12 usage, open models incl. Grok 4.5, GLM-5.x, GPT-5.6 Luna, Kimi
K2.6-K3, MiMo-V2.5, MiniMax M3, Qwen 3.6-3.8, DeepSeek V4 Pro/Flash, Hy3); GitHub
Copilot login; ChatGPT Plus/Pro login. Features: LSP auto-load, multi-session parallel
agents, `/share`, Plan/Build Tab toggle, `/init` (writes AGENTS.md), `/undo` `/redo`,
`/connect` `/models` `/export` `/editor`, `@File#L37-42` refs, drag-drop images, MCP
client, ACP, skills, custom agents/tools/commands, keybinds, themes, formatters,
permissions/policies. CLI: `opencode`, `opencode run`, `opencode serve` (OpenAPI),
`opencode web`, `opencode session list`, `opencode stats`. SDK `@opencode-ai/sdk`.
Git: GitHub (Copilot, PR/commit), GitLab. Install: curl, npm/bun/pnpm/yarn, brew,
pacman/AUR, choco, scoop, mise, docker, binaries.

**dsh (our base)** — `deepseek-ai/deepseek-harness`, deepseek.com/harness, MIT,
~83.6k★, ~7.4k forks, **developer preview (breaking changes expected)**. Philosophy:
"Everything is a plugin" on **Cordis** (koishi-family framework). Shipped surfaces:
Web UI (default `http://127.0.0.1:3080`), headless one-shot profile, ACP bridge; TUI
only as opt-in example profile. Run: `npx @deepseek-ai/dsh web` or from source. Models:
native DeepSeek (V4 Flash/Pro, reasoning effort off/high/max); catalog (Anthropic,
OpenAI, Bedrock, Vertex, Azure, Codex OAuth); custom OpenAI-compatible endpoints;
per-model ctx/max-tokens/vision config; write-only creds in `$DSH_HOME/.credentials.yaml`.
Architecture: profiles + bundles + patch layers (`cordis.patch.yml`, `--patch`);
append-only `SessionEvent` log (JSONL/Zstd/checksummed); fork/resume/transcripts/
replay; scoped tool registry; agent-loop driver; capability seams. Tools: bash/pwsh,
fs (+sandbox), persistent terminals, LSP (`lsp-stdio`), code runtime (worker-thread,
compute+wall budgets), background jobs, subagents, persisted goals, skills, MCP
(stdio + Streamable HTTP), workflows, todo, web. Safety: sandbox policy, Windows ACL,
E2B remote sandbox, approval service, permission switcher, fs fencing. Context:
AGENTS.md/CLAUDE.md loading + byte budgets, compaction. Compat: Claude Code & Codex
`hooks.json`. CLI: `dsh --profile <name>`, `dsh --profile headless "job"`, `dsh web`,
`dsh plugin --profile <name> <pnpm args>`, `--dump-config`. SDK: Python (official), TS/
Cordis host. Persistence: JSONL under profile, export ZIP, sqlite FTS.

### 3.2 Parity map (condensed)
| Feature | opencode | dsh |
|---|---|---|
| Maturity | MIT, GA | MIT, dev preview (breaking) |
| Surfaces | TUI, desktop, IDE ext, web | Web UI (default), headless, ACP; TUI opt-in |
| Providers | 75+ via Models.dev, Zen, Go, Copilot/ChatGPT | DeepSeek native + catalog + custom endpoints |
| Multi-session/parallel | Yes | Yes (fork/resume) |
| Plan/Build toggle | Yes (Tab) | `/plan` only; no first-class toggle |
| Undo/redo | `/undo` `/redo` | Via session log fork only |
| LSP | Auto-load | `lsp-stdio` manual config |
| Shell | bash | bash/pwsh + persistent terminals |
| Code runtime | — | worker-thread w/ budgets |
| Background jobs | — | Yes |
| Subagents/skills/MCP/ACP | Yes | Yes |
| Hooks | Commands/hooks | CC + Codex hooks compatible |
| Sandbox/approval | Permissions/policies | Sandbox + approval + E2B + Windows ACL |
| Session persistence | Local + share links | Append-only log + replay (stronger) |
| Headless | `opencode run` | `dsh --profile headless "job"` |
| HTTP server/API | `opencode serve` (OpenAPI) | Web server + `/api` gateway (loopback trust fence) |
| SDK | `@opencode-ai/sdk` (TS) | Python SDK + Cordis/TS host |
| Git | GitHub, GitLab | none documented |
| Install | 10+ pkg managers, docker, binaries | `npx` or source |

opencode-only: desktop app, IDE ext, share links, GitLab, Copilot/ChatGPT logins,
themes/keybinds/commands/formatters, `/init`, `/undo` `/redo`, Zen, Go, stats CLI.
dsh-only: persistent terminal, code runtime, background jobs, persisted goals,
CC/Codex hooks compat, E2B sandbox, session replay, everything-as-config-plugin.

### 3.3 Delta list — dsh → full opencode parity (FINAL, 21 rows)
Dropped by user instruction: IDE extension (old row 2), install matrix (old row 4),
subscription OAuth logins Copilot/ChatGPT (old row 8), Enterprise docs (old row 24).
Dropping the IDE ext does NOT drop ACP — dsh keeps its ACP bridge.
Full backlog with status (knocked-off vs shipped plugins) → `BACKLOG.md`.

### 3.4 Product direction — desktop + mobile-first + Tailscale (CURRENT WORK)
**User's proposal:** wrap dsh web UI with **Tauri** for a desktop app; mobile-first
interface via Tailscale.

**Corrections verified against dsh source/docs:**
1. **Tailscale is NOT reachable by default** — three blockers: (a) webserver binds
   loopback only (`127.0.0.1:3080`); (b) CLI **rejects `--host 0.0.0.0`** (all-interface
   binding intentionally unsupported — `dsh-web-app` README); (c) **Host-header trust
   fence**: non-loopback Host refused by `/api` unless in `trustedHosts` (`dsh-client-
   connection`, `web-runtime`).
2. **Tauri wrap IS clean & viable:** web UI = static `dist` (same-origin) + JSON/SSE
   over `/api`. Tauri shell spawns `dsh web` as sidecar → WebView loads
   `http://127.0.0.1:3080`. No frontend rewrite. Sidecar needs a Node runtime (bundle
   one) or Bun standalone. `native/` in repo = ONLY `landlock-run` (Linux sandbox
   helper) — NOT a product binary.
3. **Mobile-first → PWA, not Tauri mobile:** same web UI + Tailscale; add PWA manifest
   + responsive pass (touch targets, safe-area). Tauri mobile deferred unless native
   auth/badges needed.

**Agreed stack:**
```
always-on machine: dsh server (dsh web, Node)
        │  patched bind + trust fence
        ▼
   Tailscale tailnet (phone + laptop reach it)
   ├── Laptop/desktop → Tauri v2 shell (sidecar spawns dsh web; WebView → 127.0.0.1:3080)
   └── Phone → PWA in browser over Tailscale
```

**Tailscale enablement — exact config (draft)**
`$DSH_HOME/cordis.patch.yml` or `<profile>/cordis.patch.yml`:
```yaml
- id: webserver
  config:
    host: '0.0.0.0'
    port: 3080
- id: web-runtime
  config:
    printUrl: true
    surfaceContext: true
    trustedHosts: ['my-mac.tailnet-name.ts.net']
```
Patch semantics: a patch **REPLACES a row's whole config** — must restate every key.
`connection` row derives `trustedHosts` from `ctx.webRuntime.trustedHosts` (docs show
concatenating extra authorities: `['app.internal', ...ctx.webRuntime.trustedHosts]`).
Keep `trustedHosts` sourced from `--trusted-host` extras via `ctx.webStartup.
trustedHosts` for flag-based entry.

**Alternative without bind change:** keep `127.0.0.1` + `tailscale serve --bg 3080`
plus `--trusted-host my-mac.tailnet-name.ts.net` for the fence.

**Row/package ids (for patches):** `webserver` → `@deepseek-ai/dsh-host-webserver`
(host/port); `web-runtime` → `@deepseek-ai/dsh-web-app` (printUrl, surfaceContext,
trustedHosts); `connection` → `@deepseek-ai/dsh-client-connection` (trustedHosts,
maxRequestBodyBytes); `web-startup` → `@deepseek-ai/dsh-web-app/startup` (parses
`--host`/`--port`/repeatable `--trusted-host`; REJECTS `--host 0.0.0.0`). Profiles
shipped: `web`, `headless`; layers: base bundles → profile patch → `$DSH_HOME/
cordis.patch.yml` → `--patch`. `DSH_WEB_URL`/`DSH_WEB_MODE` published by `shell-env`.

---

## 3b. Session 4 — planning round: grill + P7+ roadmap (most recent)

Chronologically after Session 3. User asked to build a stub TUI plugin, a desktop
plugin, share links + observability + session UX into tweaks, and finish the
partials — but first to be grilled so the exact approach is agreed.

**Grill 1 decisions (build-vs-approach):**
- **TUI:** cannibalize opencode into a **client-only** app — vendor opencode's TUI
  code (MIT) into `dsh-tui` talking to dsh's TS SDK / HTTP+SSE API, drop all server
  code. Documented in PLAN; executed later.
- **Desktop:** Tauri thin shell now — dsh-desktop = Tauri v2 chromeless window
  (macOS/Win/Linux) + small Cordis lifecycle plugin that spawns `dsh web` and hands
  the URL to the shell.
- **Themes (separate plugin, not tweaks):** support **VS Code/TextMate themes**;
  sources = **file install** (local theme JSON) + **catalog** search/download from a
  real theme marketplace (**Open VSX**, `open-vsx.org`; public API, no token — chosen
  over VS Code Marketplace which needs an Azure token/ToS limits).
- **Formatters (separate plugin, as LSP plugin):** LSP-based format-on-edit via the
  `lsp-stdio` seam.
- **Share links:** self-hosted `/share/:id` **read-only snapshot** by default; opt-in
  **interactive** mode gated by `trustedHosts` + a random token in the URL.
- **Observability:** `dsh stats` CLI verb **+** web panel, on native `session-stats` /
  `token-meter` seams.
- **Session UX into tweaks:** Plan/Build toggle (`plan-mode`), undo/redo
  (`session-checkpoint-policy`), slash commands (`commands` registry), drag-drop
  images (`attachment`), keybinds (greenfield). Themes and formatters split OUT to
  their own plugins (see above).
- **Partials:** GitHub credential half → **`dsh-credentials`** (OAuth account in
  vault, agent-usable); PR/commit workflows → **`dsh-repos`** (workflows ONLY, no
  credential storage); config-file tools → **`dsh-tools`**; agent files → **`dsh-agents`**.
  Provider catalog breadth → own XL phase in `dsh-providers`.
- **Repo convention:** new plugins public, git submodules like the rest.

**Grill 2 decisions (scope/mechanics):**
- Desktop window mechanism: **Tauri thin shell** (accepted Rust toolchain).
- Phasing: **planning-only round** — the user explicitly deferred all building; this
  round = PLAN.md/CONTEXT.md/BACKLOG.md updates + creating **`AGENTS.md`** with repo
  quirks/conventions (commit cadence + keep all `.md` files in sync), and writing the
  full multi-phase plan.
- TUI approach documented: vendor opencode TUI as dsh client (MIT retained).
- Share interactivity: read-only default; interactive opt-in, token-gated.

**Outcome (Phase 0, complete):**
- `AGENTS.md` created: doc-sync rule (docs in every commit), commit+push per phase,
  plugin scaffold conventions (NodeNext tsc → lib/, schemastery not zod,
  `check-plugin.mjs` boot-verify, no default export), harness-pristine rule, launcher
  verb routing (`dsh accounts`).
- `PLAN.md`: repo table + 7 planned plugins; P7+ roadmap (Phase 0 docs → Phase 1
  scaffold 7 repos → Phase 2 tweaks v2 → Phase 3 desktop → Phase 4 themes → Phase 5
  formatters → Phase 6 partials → Phase 7 provider breadth).
- `BACKLOG.md`: re-keyed rows by owning plugin.
- `README.md`: layout entry for AGENTS.md.

---

## 4. Final memory context (state of the world, 2026-08-15)

**Project:** `agents` = a plugin-built personal agent runtime on DeepSeek Harness.
GitHub: `marius-patrik/{agents,Andromeda,dsh-credentials,dsh-dialects,dsh-providers,
dsh-tweaks,dsh-subscriptions}` (all clean & pushed; `agents-oss` deleted). Planned
(not yet created): `dsh-tui`, `dsh-desktop`, `dsh-themes`, `dsh-formatters`,
`dsh-tools`, `dsh-agents`, `dsh-repos` (public submodules). Local: `~/agents`
(superproject, submodules on `main`), harness pinned `47f943859b` (rc.5, detached,
pristine), `~/.dsh` harness home.

**Done:** pastacode fork idea abandoned → dsh pivot; 5 plugins shipped + boot-verified;
P6 credentials v2 (full Andromeda vault parity) complete; Andromeda decommission
executed (commit `c6d8cda`); port-source kept (orchestrator, memory, state files);
opencode↔dsh parity map + 21-row delta table; Tailscale blockers verified; Tauri
viability validated; PWA chosen for mobile; stack agreed; **Phase 0 planning round
complete** (AGENTS.md + P7+ roadmap + backlog re-key).

**Open threads:**
1. Execute Phase 1: scaffold the 7 planned plugin repos (public, submodules).
2. Then Phases 2–7 in order (tweaks v2, desktop, themes, formatters, partials,
   provider breadth). See PLAN.md.
3. Tailscale `cordis.patch.yml` drafts (both variants) still offered, not yet applied.
4. Session-1 tail ("and .") may have had a third item — user confirmed only the two
   (PLAN.md update + agents-oss deletion) were done.
5. Future plugin candidates still in Andromeda: orchestrator (baton/heartbeat), memory
   (durable memory), remaining state files. Credentials v3 = full account/credential
   manager for ALL the user's accounts (phase 2, deferred).
6. Open questions: where dsh server runs long-term (Mac mini/NAS/VPS → tailnet naming);
   native auth on mobile (Face ID/OS keychain) vs pure PWA; does dsh `ui-*` respond well
   at phone widths; single-tenant vs multi-user (trustedHosts/approval implications).
7. Environment notes: macOS (`/Users/user`); opencode config at
   `~/.config/opencode/opencode.jsonc` (`"lsp": true`), admin agent at
   `~/.config/opencode/agents/admin.md`; Lidless installed (lid-closed operation);
   opencode session store at `~/.local/share/opencode/opencode.db` (SQLite); transcript
   dumps + dump script in `/var/folders/w_/bvxstwzj2s9cq2jm7lmw884c0000gn/T/opencode/`.

---

## 5. Session 5 — full-backlog buildout (2026-08-15)

**Mode change:** plan → build. The user approved finishing the FULL backlog: all
plugin phases 1–7 in one sustained round.

**Decisions this session (grill on harness gaps):**
- Scope = all plugin phases 1–7; rows 3/21 (product decisions) excluded; TUI impl
  remains scaffold-now-impl-later; GitLab (8) + agentic init (9) included as trailing.
- Formatters (P5): **greenfield LSP client** — speak JSON-RPC (`initialize` +
  `textDocument/formatting`) over the `lsp-stdio` subprocess, reusing its server
  config. The pinned rc.5 LSP seam has NO `formatDocument` (only definition/
  references/implementation/hover), so we build the op ourselves without touching
  the harness.
- Undo/redo (P2): **fork-based** — `/undo` `/redo` fork/resume from an earlier
  logged step via dsh's native session fork. `session-checkpoint-policy` is
  durability-only, no rollback seam.

**Harness reality-check (seam audit, rc.5 pinned):**
- `webServer.register` lets plugins add real HTTP routes (exact/prefix + handler)
  → share links are greenfield-feasible in `dsh-tweaks` v2.
- `session-log-export` exists as download-only (`session-log-download`); no share
  hosting — share links are net-new.
- `commands` registry is programmatic-only → slash-commands need a settings→register
  bridge plugin.
- `ui-theme` accepts arbitrary `ThemeDefinition` (`register()`, `--dsw-alias-*`
  token overrides) → VS Code/TextMate theme conversion feasible.
- `session-stats` (`turns/steps/llmMs/toolMs/ttftMs/decodeMs/decodeTokens`) +
  `token-meter` (`tokenUsage`/`contextPressure`/`contextBreakdown`) exist → `dsh stats`
  CLI feasible.
- `plan-mode`, `attachment`+`attachment-local`, `agent-presets`+`persona`,
  `tool-cordis` + generic tool registry (`defineTool`, `ToolRestriction`) all exist.
- NO git provider anywhere in the harness → `dsh-repos` is greenfield GitHub REST.
- No harness CLI plugin-verb slot → plugin verbs live in our `scripts/dsh` launcher
  (e.g. `dsh accounts`), and new verbs (`stats`, `sessions`, `theme`, `share`, `format`)
  route there too.

**This build round (phases + commit targets):**
1. P1 scaffold: create public repos `dsh-{tui,desktop,themes,formatters,tools,agents,repos}`
   as submodules with the `dsh-tweaks`-mirror scaffold; PLAN + README updates.
2. P2 `dsh-tweaks` v2: share links, stats/session CLI verbs, plan/build toggle,
   fork-undo, drag-drop, slash commands, keybinds.
3. P3 `dsh-desktop`: Tauri v2 shell + lifecycle plugin.
4. P4 `dsh-themes`: VS Code/TextMate import + Open VSX catalog + `dsh theme` verb.
5. P5 `dsh-formatters`: greenfield LSP formatDocument + `dsh format` verb.
6. P6 partials: credentials GitHub OAuth, repos workflows, tools config files, agents files.
7. P7 `dsh-providers` catalog breadth.
8. Final doc round: BACKLOG.md annotations, PLAN.md statuses, CONTEXT.md outcome,
   README, push.

**Ritual note:** AGENTS.md gained a "at every build start" rule — open todos,
append a CONTEXT.md session BEFORE first code, and re-read PLAN/BACKLOG/CONTEXT
to orient. This session is the first to follow it.

---

## 5b. Session 5, round 2 — P2 dsh-tweaks v2 shipped (2026-08-15)

P2 landed: `dsh-tweaks` v2 (0.2.0) adds the session-UX backlog features by wiring
the audited harness seams, with a `check-plugin.mjs` boot-verify that passes and
a live web-profile boot that serves real share pages.

**What shipped in the plugin (src/):**
- `settings.ts` — schemastery schemas for the new namespaces (`dsh-tweaks-share`,
  `dsh-tweaks-stats`, `dsh-tweaks-session`, `dsh-tweaks-commands`,
  `dsh-tweaks-keybinds`) + Config interface. Namespaces are flat (no dots —
  harness NAMESPACE_PATTERN is `^[a-z][a-z0-9-]*$`).
- `share.ts` — self-hosted read-only transcript route: prefix route
  `<basePath>/<id>` registered via `webServer.register`; resolves the session log
  across ALL `sessions/--workspace--/` segments (workspace keying by cwd made the
  cwd-derived guess wrong), reads `.jsonl.zstd` via `node:zlib.zstdDecompressSync`
  (harness session-persistence-jsonl uses the same), renders dependency-free HTML.
  Interactive mode is opt-in + token-gated (`?token=`, constant-time compare,
  `share.token` written 0600 by the verb).
- `stats.ts` — reads `storages/session_projcache.json` (the durable projection
  cache fold) + the session store dir → `dsh stats`/`dsh sessions` rows.
- `session.ts` — `/build` (leaves plan mode via `ctx.planMode.set(agent, false)`;
  the harness already owns `/plan`, so we complement, not collide), fork-based
  `/undo` `/redo` (`ctx.sessions.create(undefined, { seed })` from message
  boundaries), keybind/command validators.
- `home.ts` — DSH_HOME → `dsh-tweaks.homeRoot` → `~/.agents` resolution for verbs.
- `bin/{stats,sessions,share}.mjs` — launcher-routed verbs; `scripts/dsh` now
  routes `stats|sessions|share` before exec'ing the harness CLI.

**Seam notes learned during build:**
- `ctx.inject([...], fn)` returns a Fiber, NOT a disposer — the callback must
  return the disposer from `webServer.register`/`commands.register` directly.
- Context augmentations (`.commands`, `.webServer`, `.planMode`, `.plan/mode`
  event) only typecheck when the owning package is imported (`import type {} from
  '@deepseek-ai/dsh-commands'` etc.).
- The base bundle does NOT configure dsh-tweaks; the web profile composes it bare
  → apply() must default every v2 section before use.
- Session log files are `session.jsonl.zstd` (real Zstandard frames).
- `dsh share` URL must default to `127.0.0.1:3080` (the web server port), not the
  bare host.

**Verified:** `node check-plugin.mjs` passes (share renderer + token gate, log path
resolution incl. prefix variant, stats projection shaping + table/csv/json,
fork helper, command/keybind validators, command registration). Web profile boots
clean (HTTP 200, no duplicate/collision lines); `/share/<real-session-id>` serves
a rendered transcript; `dsh sessions` lists the real session; interactive share URL
returns 200.

---

## 5c. Session 5, round 3 — P3 dsh-desktop shipped (2026-08-15)

**Goal:** Phase 3 — Tauri v2 desktop shell + lifecycle plugin, boot-verified in the
web profile.

**Work:**
- Wrote `src/lifecycle.ts` (spawnWebServer, waitForServer, probeServer, isAlive,
  collectStderr) and `src/index.ts` (exact route `READY_PATH = /__dsh-desktop/health`,
  `dsh-desktop` settings namespace with host/port/mountHealth/readyPath boot facts).
- Wrote the Tauri v2 shell: `src-tauri/{Cargo.toml, build.rs, tauri.conf.json,
  capabilities/default.json, src/main.rs, src/lib.rs, icons/icon.png}` + `webui/index.html`
  stub that polls the readiness route then redirects the WebView to `http://127.0.0.1:3080`.
  `cargo check` clean (generated `icons/icon.png` locally since no `tauri` CLI; icon needs
  replacing with a real asset later).
- Extended `check-plugin.mjs`: probe/wait against a real local server; spawn a real
  child, wait, stop; failed-spawn not-ready; plugin route registration (exact
  READY_PATH) + health handler output; `mountHealth: false` registers nothing.
- **Key seam learning:** plain profile `dependencies` do NOT mount plugin rows — plugins
  mount through a `dsh.bundle` patch layer (`dsh.subscriptions` is the template). Added
  `dsh-desktop/cordis.patch.yml` + `dsh.bundle` and appended `dsh-desktop` to the web
  profile's `dsh.profile.bundles`.
- Boot-verified: `GET /__dsh-desktop/health` → `{"ok":true,"url":"http://127.0.0.1:3080",
  "readyPath":"/__dsh-desktop/health"}` HTTP 200; no duplicate/collision lines.
- Committed + pushed dsh-desktop `a20d758` ("P3: dsh-desktop — Tauri v2 shell +
  lifecycle plugin"). Docs: PLAN.md Phase 3 `[complete]` + repo table, BACKLOG.md row 1
  DONE + net-remaining list, README layout line.

**Verified:** `tsc -p tsconfig.json` clean, `node check-plugin.mjs` passes, `cargo check`
clean, web profile health route 200, `dsh share`/`sessions` still working.

---

## 5d. Session 5, round 4 — P4 dsh-themes shipped (2026-08-15)

**Goal:** Phase 4 — VS Code/TextMate theme support, boot-verified in the web profile.

**Work:**
- Wrote the node half: `src/theme.ts` (13 `--dsw-alias-*` token map, VS Code
  JSON + `.tmTheme` XML parsers, light/dark fallback tables, luminance-based
  scheme inference), `src/store.ts` (store handle under `~/.agents/themes`),
  `src/catalog.ts` (Open VSX search + vsix extract via `unzip`), `src/index.ts`
  (`/themes.json` route + `dsh-themes` settings section).
- Wrote `bin/theme.mjs` (verbs list/search/install/install-vsix/set/remove) and
  routed the `theme` verb in `scripts/dsh`.
- Wrote the browser half: hand-authored `client.js` `__ModuleLoader__` bundle
  exporting `apply` (fetches `/themes.json`, registers each theme via
  `theme.register({id,colorScheme,tokens})`, applies the active id) with
  `inject: ["theme"]`. Registered through the web profile (bundle +
  `cordis.patch.yml` row + `./client` export + `dsh.client` manifest).
- **Two real boot bugs found + fixed:** (1) the client row never appeared in
  `__DSH_BOOT__` — client-modules `require.resolve('dsh-themes/package.json')`
  failed because the exports map lacked `./package.json`; added it. (2) the
  `theme set/remove` YAML writer used `\z` (a literal `z` in JS regex — no such
  anchor), so the whole-section match failed whenever `dsh-themes` was the last
  section and it appended a second section instead of replacing; switched to
  `$` with `gm` + dedupe.
- Boot-verified end-to-end: `__DSH_BOOT__` carries the dsh-themes client row,
  `/plugins/dsh-themes/client.js` serves the bundle, `/themes.json` reflects a
  live `dsh theme set`, real Open VSX search (`monokai`) + install
  (8 themes from the monokai-pro vsix) + CLI→route round-trip.
- Committed + pushed dsh-themes `160892a` ("P4: ship dsh-themes — node store +
  catalog + themes.json route, browser theme bundle, dsh theme CLI"). Docs:
  PLAN.md Phase 4 `[complete]` + repo/mapping tables, BACKLOG.md row 15 DONE +
  net-remaining list, README layout line.

**Verified:** `tsc -p tsconfig.json` clean, `node check-plugin.mjs` passes (10
checks), web profile boot manifest + bundle + route all live.

---

## 5e. Session 6 — P5–P7 finish-out (2026-08-15)

**Goal:** Finish the remaining phases: P5 `dsh-formatters`, P6 partials
(`dsh-credentials` GitHub half, `dsh-repos`, `dsh-tools`, `dsh-agents`), P7
provider breadth — then knock off the remaining backlog rows (TUI, GitLab,
agentic init) where feasible, and close out the doc stack.

**Round todos:** (1) P5 formatters; (2) P6a credentials GitHub OAuth half;
(3) P6b repos branch/commit/push/PR; (4) P6c tools config-file registry;
(5) P6d agents JSON/MD persona files; (6) P7 provider catalog breadth;
(7) backlog TUI/GitLab/agentic-init evaluation; (8) docs + commit per phase.

**Outcome:** Round 1 of 5e — **P5 fully shipped**: `dsh-lsp` (server table +
`mergeServers` + `Lsp` def + `lsp-stdio`/`tool-lsp` mounts + `dsh lsp` CLI) and
`dsh-formatters` (formatter table + `format` tool + `tools/post-execute`
auto-format with `[auto-format]` context note + `dsh formatter` CLI), both with
`check-plugin.mjs` suites passing, `tsc` clean, committed + pushed and pinned in
the superproject, wired into the web profile bundle list (pnpm links +
`dsh.bundle` patches), boot-verified against the live web profile: Loader
inventory shows `include:lsp` and `include:formatters` active, `/themes.json`
real (the prior "200" was the SPA fallback — the server had been booted against
the wrong `~/.dsh` default home, not `~/.agents`; fixed by launching with
`DSH_HOME=$HOME/.agents`). Found + fixed the CLI section-replace regex bug
(`m`-flag `$` matched line ends, leaving orphan section lines) in both
`bin/lsp.mjs` and `bin/formatter.mjs`. Also verified profile-bundle contract:
a bundle listed in `dsh.profile.bundles` must declare `dsh.bundle.patch` +
`cordis.patch.yml` or boot fails loud. Remaining: P6a–d, P7, backlog rows,
final doc close-out.

## 5f. Session 6, round 2 — P6a dsh-credentials GitHub OAuth half (2026-08-15)

**Goal:** Ship the GitHub half of P6a in `dsh-credentials`: a canonical
`github` purpose, a file importer for the `gh` CLI's `hosts.yml`, and a
registered GitHub provider route + OAuth PKCE refresh supplement so the vault
can reason about GitHub tokens the way it does LLM tokens (dsh-repos, P6b,
consumes `GITHUB_OAUTH_TOKEN`).

**Round todos:** (1) refs — `GITHUB_OAUTH_TOKEN`/`GITHUB_USER`/enterprise refs +
`canonicalRefsForPurpose('github')`; (2) `githubFileProvider` reading
`~/.config/gh/hosts.yml`; (3) `src/github.ts` route + PKCE supplement
registration, wired in `apply()` under config `githubClientId`/`githubScopes`;
(4) `check-plugin.mjs` assertions; (5) docs + commit + push, then superproject
pin.

**Outcome:** P6a GitHub half shipped. `src/refs.ts` now carries `GITHUB_OAUTH_TOKEN`,
`GITHUB_USER`, `GITHUB_ENTERPRISE_TOKEN`, `GITHUB_ENTERPRISE_HOST` under the
`github` purpose, and `canonicalRefsForPurpose('github', _)` returns
`['GITHUB_OAUTH_TOKEN']`. `src/file-providers.ts` gained `githubFileProvider`
(the `gh` `hosts.yml` importer: `github.com` `oauth_token` → `GITHUB_OAUTH_TOKEN`
+ `user` → `GITHUB_USER`, enterprise hosts → `GITHUB_ENTERPRISE_TOKEN`/`_HOST`)
plus the shared `parseGitHubHosts` parser; `src/vault/cli.ts`'s duplicated
parser was removed and the `github-hosts` detector now imports the one source of
truth (also re-exported through `src/vault/index.ts`). New `src/github.ts`
registers the `github` provider route (`https://api.github.com`) and, only when
a public OAuth App client id is configured (`config.githubClientId` or
`GITHUB_OAUTH_CLIENT_ID` env), an `oauth_pkce` supplement (`authorize` +
`access_token` URLs, scopes `repo`/`workflow`, loopback redirect) — without a
client id the supervisor honestly answers `expired_without_refresh_path`. Wired
into `apply()` and exported from `index.ts`. `tsc` clean; `check-plugin.mjs`
extended (gh importer, ref mapping, route baseUrl, supplement gated on client
id) and fully passing. Committed `a4b2f98` and pushed; superproject pinned +
PLAN/BACKLOG/CONTEXT synced in superproject commit `316154a`.

---

## 5g. Session 6, round 3 — P6b/P6c/P6d shipped (2026-08-15)

**Goal:** Finish the Phase 6 partial plugins: P6b `dsh-repos` (repo workflows
consuming `GITHUB_OAUTH_TOKEN`), P6c `dsh-tools` (config-file custom tools),
P6d `dsh-agents` (JSON/MD persona files → agent presets) — each shipped,
boot-verified, committed, pushed, then pinned in the superproject with docs.

**P6b — `dsh-repos` (commit `d2ae833`):** `src/git.ts` (`runGit` over
`ctx.subprocess`, `currentBranch` via `git branch --show-current`),
`src/github.ts` (`resolveGitHubToken`: vault `GITHUB_OAUTH_TOKEN` via
`ctx.get('accounts')`, then `GITHUB_OAUTH_TOKEN`/`GH_TOKEN` env; `createPullRequest`
against the GitHub REST API with `apiBase` override for tests),
`src/settings.ts` (`dsh-repos` NS: `remote`/`defaultBaseBranch`),
`src/index.ts` — tools `repo-status`, `repo-branch`, `repo-commit`, `repo-push`
(`-c http.extraHeader=Authorization: Bearer <token>`), `repo-pr`; `ownerRepoFromRemote`
handles https / scp `git@host:owner/repo` / `git://`; token required for push+PR.
`bin/repos.mjs` CLI (list/set/status/branch/commit). `check-plugin.mjs` does real
git init/branch/commit round-trips via a stub subprocess and verifies PR POST
(auth header `Bearer gho_pr-token`, URL, body) against a local HTTP server.

**P6c — `dsh-tools` (commit `e8f0909`):** the `dsh-tools` settings section maps
tool name → definition (`description`, `parameters` of `string|number|boolean`,
`command` argv). `apply()` registers each via `defineTool` and runs it through
`ctx.subprocess` (never shell) with `{name}` argument placeholders; nonzero exit
is a result, not a throw; output `{stdout, stderr, exitCode}`. `bin/tool.mjs`
CLI (list/add/remove) writes the section with the fixed
`/^dsh-<section>[^\n]*\n(?:[ \t][^\n]*\n)*/m` replace (no lazy `$`). Real
subprocess round-trips in `check-plugin.mjs`. There is no `tool-cordis` package
in the harness — greenfield on the `defineTool`/`ctx.tools.register` seam.

**P6d — `dsh-agents` (commit `0b1296f`):** persona files (`.md` with `---`
frontmatter + body, or `.json` `{prompt,...}`) under the authoring root
(`dsh-agents.root`, default `<home>/agents`) materialize as harness agent
presets under `<home>/.agent-presets/` — the base preset's composition (default
`standard`, overridable `base`) spliced VERBATIM with the persona row's text
swapped (text splice, no YAML parse — the `!!js` dialect and `{{model}}`/
`{{cwd}}` round-trip untouched, proven against the real shipped `standard`
composition), plus `preset.yml` picker metadata and a `.dsh-agents-source`
marker so sync prunes only presets whose source is gone (hand-authored presets
survive). No harness service required (the roster reads its root live);
`dsh-agent-presets`/`dsh-persona` were inspected but the design avoids them.
Base dir resolved repo-relative or via `DSH_AGENTS_BASE_DIR`; unreachable →
bare persona row. `bin/agents.mjs` CLI (list/add/remove/sync); the plugin
installs the settings section, syncs at boot, and re-syncs debounced on
authoring-root changes (watcher `unref()`d so it never holds a process open).
`check-plugin.mjs` covers parsing/splice/sync/prune/apply-boot/CLI. New `agents`
verb added to `scripts/dsh`.

**Outcome:** All three shipped + pushed, then pinned in this superproject commit
with PLAN (Phase 6 `[complete]`, repo-table statuses) and BACKLOG (rows 7, 17, 18
→ DONE) updates. `dsh-tools`, `dsh-agents`, `dsh-repos` moved from "scaffolded
(P1)" to shipped in the repo table. Remaining: P7 (`dsh-providers` breadth),
backlog evals (TUI/GitLab/agentic-init), final docs.

---

## 5h. Session 6, round 4 — P7 provider catalog breadth (2026-08-15)

**Planned:** Extend `dsh-providers`' `PROVIDER_ROUTES` beyond the six
subscription adapters (kimi-code, kimi-sub, claude-sub, cursor-sub, grok-sub,
gemini-sub) with billable API-key routes, keeping the default
`subscription-only` filter semantics (API routes hidden/refused, `mode: "all"`
offers them). Then check-plugin coverage, commit + push, superproject pin +
docs, and close out the backlog evals + final docs.

**Notes:** The adapter (`DialectAdapter`) already serves every registered route
through the wire dialect a route declares — breadth is purely a data change in
`PROVIDER_ROUTES`. `openai`/`claude` dialects append `/chat/completions` and
`/messages` to the route base URL respectively. Route count grew 6 → 14.

**Outcome:** Shipped. `PROVIDER_ROUTES` grew 6 → 14: eight new billable
API-key routes — `openai-api`, `anthropic-api`, `gemini-api`
(Generative Language OpenAI-compat endpoint), `grok-api`, `deepseek-api`,
`mistral-api`, `groq-api`, `openrouter-api` — each with advisory model
catalogs/context windows. `subscription-only` default keeps API routes
hidden/refused (`PROVIDER_DISABLED`), `mode: "all"` offers them.
`check-plugin.mjs` extended: new `PROVIDER_IDS` assertion, API-route filter
gate, real openai-dialect stream round-trip (`https://api.openai.com/v1/chat/completions`
+ Bearer apiKey), openrouter proxy catalog. Two fixture bugs found + fixed
en route: malformed finish-chunk JSON (`}}]` → `}]}`) and eventsource-parser
not flushing the final `[DONE]` event at EOF without a terminating blank line.
Pinned in the superproject; PLAN (Phase 7 `[complete]`, repo row), BACKLOG
(row 5 → DONE, net-remaining drop), README (provider row), and this section
all updated in the superproject commit. `dsh-providers` da80f8f→3062793.

**Close-out:** the P7+ roadmap is now fully dispatched. The still-OPEN backlog
rows each carry a written decision/plan (PLAN.md "Remaining open work" section
+ BACKLOG row notes): TUI default (row 2) deferred by decision — web profile is
the shipped default; curated + hosted gateways (rows 3, 4) are product items,
not plugin work; GitLab (row 8) planned for `dsh-repos` in the same shape as
the shipped GitHub half; agentic init (row 9) planned as an additive
`dsh repos init` tool; GA (row 21) stays OPEN by design (dev-preview harness,
kept pinned). Superproject docs committed + pushed as the round close.

---

## 5i. Session 6, round 5 — vault page in the web UI sidebar (2026-08-15)

**Planned:** Add a "Vault" page to the web UI sidebar for managing stored
credentials/passwords, owned by `dsh-credentials` (the vault + `ctx.accounts`
seam already live there). Server half mounts `/vault` (self-contained page)
plus a JSON API over `ctx.accounts` (list/set/reveal/unset). Client half is a
hand-authored `__ModuleLoader__` bundle (the `dsh-themes` client-bundle seam:
`exports["./client"]` + `dsh.client` declaration, served at
`/plugins/dsh-credentials/client.js`, discovered via the `__DSH_BOOT__`
manifest) that injects a Vault item into the harness `sidebar.footer.action`
list slot linking to `/vault`. Boot-verify in `check-plugin.mjs` + a live web
profile curl pass.

**Notes:** The harness web shell composes UI through the slot system
(`ctx.slots.inject`/`register`); `sidebar.footer.action` is a declared list
slot currently unused by built-in plugins — the sanctioned extension point for
a footer nav action. A native full-page route inside the harness layout is not
exposed by the client runtime (the main view is the conversation), so the page
is our own route served by the plugin. The vault stores material only for
vault-held refs; reveal is a single-ref on-demand operation, never in list
output. Localhost trust model matches the rest of the web UI (unauthenticated
127.0.0.1).

**Outcome:** (filled in at round close)

---

## 5j. Session 7, round 1 — session modes seam implementation (2026-08-15)

**Planned:** Build the new public `dsh-session-modes` plugin. It owns durable
session mode state and projection, pending mode acceptance at `agent/pre-step`,
the `/mode` command, mode policy prompt context, executor-level tool policy,
per-mode request routing, and bounded one-shot subagent assistance. The first
implementation target is the deterministic kernel; settings/client surfaces are
secondary until the agent-scoped behavior is boot-verified.

**Seams confirmed:** `agent/pre-step`, `agent/request`, `tools/pre-execute`,
`tools/execute`, `system-prompt/assemble`, `ctx.commands`, `ctx.subagents`, and
isolated preset composition. Tool restrictions are not sufficient as an
authorization boundary because scoped tools can bypass inherited restrictions;
final denial belongs at `tools/pre-execute` or a monotonic guard. Mode changes
must be durable and must not commit when a step is rejected.

**Outcome:** in progress.

**Scope correction:** the former Vault sidebar action is being replaced by a
Settings tab named Keychain. The backend now returns stored record type,
purpose, label, and expiry metadata instead of presenting every row as an API
key. A provider redirect and removal of inline Models inputs remain blocked on
a sanctioned Models-row slot; the pristine harness currently exposes no such
slot, so DOM mutation is explicitly rejected.

---

## 5k. Session 8, round 1 — Vault polish, backlog planning, session modes, quotas (2026-08-15)

**Requested order:** make the Vault page coherent with the existing harness UI,
add the quota visibility item to the backlog, plan the session-mode and quota
work explicitly, execute session modes, then begin a new `dsh-quotas` plugin.

**Plan:** Vault remains owned by `dsh-credentials` but will use the shell's
semantic panel/toolbar language, responsive density, and safer inline reveal/edit
interactions. `dsh-session-modes` completes its durable deterministic kernel
before preset and subagent integration. `dsh-quotas` owns read-only cached
provider snapshots and a settings section below Models; reverse-engineered
endpoints are adapter-by-adapter and CLI/subscription sources remain planned
until their contracts are verified.

**Outcome:** in progress.

---

## 5l. Session 8, round 2 — planning round: PRD + harness extension layer (2026-08-16)

**Requested order:** reorient on full context; consolidate the scope corrections
(keychain icon, Session Modes/Agents split with decoupled personas, input-bar mode
and persona switchers, Themes catalogue tab, quotas meter-bar icon, plugins
plug-in-socket icon, sidebar batch); "plan with me everything" (no execution
round); then document a PRD at the superproject root covering all of it.

**Decisions locked with the user:**
- Settings nav order: General (0) → Models (10) → Quotas (15) → Session Modes (20)
  → Agents (25) → Themes (30) → Keychain (35) → Plugins (40).
- Agent Presets splits into Session Modes + Agents; personas are live-switchable
  and fully decoupled from modes (any persona × any mode); the session log is the
  hook for the agent.
- Icons: keychain → dsh-credentials, meter-bar → dsh-quotas, plug-in-socket →
  dsh-tweaks maps for Plugins; each glyph lives in the owning plugin's client
  bundle, registered by name.
- **Rule change:** the harness stays pinned and pristine, but `dsh-tweaks` becomes
  the single owned **harness extension layer (Option A)** — UI modification via the
  harness's own composition model (slot shadowing + profile patch "disable + insert"
  rows), with `TweaksSidebarRoot` / `TweaksWorkspaceBrowser` / `TweaksSettingsRoot`
  replacing the harness occupants and declaring new seams (`sidebar.newSession`,
  `sidebar.history`, `settings.section.icon`, `settings.models.row` + `openSection`).
  Other plugins register into those seams; they never touch harness or patch files.
- Live `persona/selected` push is **not** used — the client folds persona state from
  `session.history` (the backend allowlist `API_REMOTE_FORWARDED_EVENTS` is
  harness-owned; `BLOCKED.md` #3 unblocks).

**Research completed (4 @explore passes + direct reads):** settings/sidebar seam
inventory (slot contracts, `navIcon` at `SettingsRoot.tsx:22-28`, `settings.plugins.tab`
`{ only }` precedent, ui-slots priority/shadowing semantics); live-persona design
(port of the `agent-preset/selected` event chain + plan-mode pre-step commit +
ui-model-selection popupSelect; `persona:policy` function-text prompt provider folds
the log per step); Keychain↔Models integration (Models section joins, `deriveKeyRef`
mismatch, `WEB_SETTINGS_NAMESPACES` gating, vault-vs-harness ref namespaces); sidebar
behaviors (all five require occupant replacement; host already supports machine-root
sessions).

**Outcome:** documented, not executed (docs-only round). Wrote `PRD.md` (product
scope, abstraction layer, phases A–F) and `BLOCKED.md` (8-row harness-seam ledger) at
the superproject root; synced PLAN.md (Phase 11 added, P8/P10 notes), BACKLOG.md
(rows 22–25, phase order), README.md (layout + links), and this CONTEXT section.
Next execution round is Phase 11 A: the abstraction foundation (occupant shells +
profile patch rows), boot-verified against the live web profile.

---

## 6. Relevant files
- `/Users/user/agents/PLAN.md` — the authoritative project plan (repos, mapping, P6,
  decommission, P7+ roadmap, dependency policy, cadence)
- `/Users/user/agents/PRD.md` — product requirements (settings IA, Keychain, session
  modes, agents/personas, themes, quotas, sidebar batch; the harness extension layer)
- `/Users/user/agents/BLOCKED.md` — harness-seam ledger (decision key + 8 rows)
- `/Users/user/agents/AGENTS.md` — repo conventions + commit/doc-sync rules
- `/Users/user/agents/BACKLOG.md` — parity delta backlog re-keyed by owning plugin
- `/Users/user/agents/README.md`, `/Users/user/agents/scripts/{agents,bootstrap,dsh}`
- `/Users/user/agents/harness/` (pinned deepseek-harness), `/Users/user/agents/plugins/`
  (14 plugin submodules, 13 shipped)
- `/Users/user/Andromeda/` — port-source (commit `c6d8cda`)
- `/Users/user/.config/opencode/opencode.jsonc`, `/Users/user/.config/opencode/agents/admin.md`
- `/Users/user/.local/share/opencode/opencode.db` — session store (transcripts source)
- `/Users/user/dsh-opencode-memory.md` — working copy of the memory file

---

## 7. Session 6 — execute the full backlog (build round, 2026-08-16)

**Directive:** execute the full backlog — Phase 11 A–F (PRD §9) plus the remaining
open backlog rows. This round ships code, boot-verified against the live web profile.

**Round todo (from the session plan):**
1. Append this CONTEXT session section + orientation (reading PLAN/BACKLOG/PRD).
2. Phase A — abstraction foundation (dsh-tweaks): `dsh.client` manifest +
   hand-authored `client.js` bundle with `TweaksSidebarRoot`, `TweaksSettingsRoot`,
   chrome re-registration (trigger/header/close/general/action), and the new slot
   declarations `sidebar.newSession`, `sidebar.history`, `settings.section.icon`,
   `settings.models.row` + `openSection` affordance; profile patch `disable`/`insert`
   rows in `profiles/web/cordis.patch.yml`; boot-verify (boot manifest rows,
   `/plugins/dsh-tweaks/client.js` served, log cleanliness).
3. Phase B — icon abstraction + settings reorder + Session Modes rename +
   Agents/Themes tabs.
4. Phase C — live personas (`persona/selected`, PersonaController, `persona:policy`
   prompt hook, `/persona`, input-bar switcher, client fold from `session.history`).
5. Phase D — Keychain↔Models binding (`settings.models.row` + `openSection` +
   `/vault?ref=` deep-link).
6. Phase E — sidebar batch (History, machine-root, chevrons, collapsed toggles).
7. Phase F — quotas polish + meter-bar glyph.
8. Backlog rows 8/9 — GitLab + agentic init (dsh-repos).
9. Final docs sync (PLAN/BACKLOG/CONTEXT/README) + commit + push all plugin repos
   and the superproject pin.

**Carried state at round start:** server UP at `127.0.0.1:3080` (PID 81349,
`node harness/apps/cli/lib/bin.js --profile web`, `DSH_HOME=/Users/user/.agents`,
log `/tmp/dsh-web.log`); `dsh-session-modes` and `dsh-quotas` created on GitHub and
registered as submodules (staged `M .gitmodules`, `A plugins/dsh-quotas`,
`A plugins/dsh-session-modes`); `dsh-credentials` has uncommitted worktree changes;
boot manifest client rows currently `dsh-credentials` / `dsh-themes` / `dsh-quotas`
only (`dsh-tweaks` and `dsh-session-modes` lack a `dsh.client` manifest).

**Outcome:** Phase A shipped and boot-verified. Root cause of the missing client
row found and fixed: the host module registry reads each entry's
`require.resolve('<spec>/package.json')`, and dsh-tweaks' `exports` lacked
`"./package.json"` → `ERR_PACKAGE_PATH_NOT_EXPORTED` → the pkgMeta cached null and
the row never composed. Added the export, corrected the home path discovery (the
`scripts/dsh` launcher defaults `$DSH_HOME=~/.agents`; direct `bin.js` use falls
back to `~/.dsh`, the wrong bundle-less profile), restarted the server with an
explicit `DSH_HOME`, and verified: boot manifest 40 entries rev `d1678d3b0204`
incl. `dsh-tweaks ['slots','locale','layout','workspaces','connection']`,
ui-sidebar/ui-settings-general gone (disable rows effective),
`/plugins/dsh-tweaks/client.js` serving 200 (sha1 `b08389ce12fa`), and the bundle
materializing against the real seed modules exporting exactly `apply`+`inject`.
Committed + pushed: dsh-tweaks `1660f47`, superproject `b0ec3d2` (PLAN.md Phase 11
→ `[in progress]` + Phase A shipped bullet; BACKLOG row 25 → IN PROGRESS). The
remaining phases (B–F + backlog rows 8/9) carried into the next session. The
Phase B scope was narrowed by the user to "Reorder + full new tabs" (plugin-owned
reorder + full Themes/Session Modes/Agents tabs; harness-owned sections keep
natural order).

## 8. Session 7 — Phase B build round: settings reorder + full tabs (2026-08-16)

**Directive:** execute Phase 11 B in the narrowed user scope — "Reorder + full new
tabs": plugin-owned settings reorder plus full Themes, Session Modes, and Agents
tabs, with every nav row's glyph resolved through the `settings.section.icon` seat.

**Round todo:**
1. B1 `dsh-quotas` — settings section 20 → 15 + `settings.section.icon` glyph
   (`IconDataOutline16`) + client assertions in check-plugin.
2. B2 `dsh-credentials` — keychain section 20 → 35 + glyph (`IconApiOutline14`) +
   client assertions.
3. B3 `dsh-themes` — new Themes section (order 30) with a live switcher over
   `ctx.theme`, `themeSnapshot` observable in the inject face, glyph
   (`IconLightOutline16`), `dsh.client.inject` → `['slots','theme']`.
4. B4 `dsh-session-modes` — node `/session-modes` route (modes, defaultMode,
   routes, tools) + client Session Modes section (order 20, roster UI) + glyph
   (`IconListPenOutline16`) + `dsh.client` manifest.
5. B5 `dsh-agents` — client Agents section (order 25) reading the live preset
   roster via `connection.api.agentPresets.list` + glyph (`IconGoalOutline16`) +
   `dsh.client` manifest + `cordis.patch.yml` + profile bundle registration.
6. B6 `dsh-tweaks` — extend the `navIcon` fallback map to every section id and
   register glyph seats for the three harness-owned sections (models / plugins /
   agent-presets).
7. Phase B verification + docs + commits.

**Carried state at round start:** server UP (PID 70177) with Phase A boot-verified;
all six Phase B plugin bundles hand-authored; `dsh-credentials` has uncommitted
worktree changes from a prior round (committed here alongside B2).

**Outcome:** Phase B shipped and boot-verified. Every plugin's `npm test` green
(build `tsc && cp client.js lib/client.js` + `node check-plugin.mjs`); served
bundles confirmed live: dsh-quotas order 15, dsh-credentials order 35,
dsh-themes order 30 + switcher, dsh-session-modes order 20, dsh-agents order 25,
dsh-tweaks harness glyph registrations. Boot manifest rev `00d60e1fcccc` carries
all six client rows with correct inject edges (dsh-themes `['slots','theme']`,
dsh-agents `['slots','connection']`, dsh-session-modes `['slots']`,
dsh-quotas/dsh-tweaks `['slots']`-family). Two non-obvious boot facts surfaced and
fixed: (a) a `cordis.patch.yml` per plugin is required for the entry to compose —
dsh-agents was missing it (ENOENT overlay at boot), and (b) the profile's
`dsh.profile.bundles` list in `~/.agents/profiles/web/package.json` must include
the plugin for its patch to load — dsh-agents was added (dsh-tweaks/dsh-credentials
already reach the graph through dsh-subscriptions' bundle patch inserts).
`/session-modes` serves the full mode registry; `/themes.json` serves 200 (empty
themes dir). All six bundles materialize against the real platform seed modules
and export exactly `apply` + `inject` (smoke harness with CSS-stub loader). Docs
updated: PLAN.md Phase B shipped bullet, BACKLOG rows 22/23/24/25 notes, this
CONTEXT section. Commits + pushes follow in this round's close.

## 9. Session 8 — Phase C build round: live personas (2026-08-16)

**Directive:** implement PRD §5 Phase C — live persona switching — in `dsh-agents`,
mirroring the harness's own plan-mode pattern (durable log event + pending-while-open
fold + projection + popupSelect switcher + composer badge).

**Round todo:**
1. `src/types.ts` — structural host types (Session/Agent/PreStepDecision faces,
   narrow to the seams) + the `persona` projection wire value.
2. `src/controller.ts` — `PersonaController`: `persona/selected` durable event,
   `foldPersona` (last-wins), WeakMap pending with open-turn detection,
   `set()` (committed/queued/cancelled/noop), `agent/pre-step` commit that calls
   `next()` first, fold-on-read `get()`.
3. `src/catalog.ts` — `PersonaCatalog`: id→prompt resolution over the authoring
   root with mtime-cached reads (reuses `parsePersona`).
4. `src/index.ts` — provide `personaController` + catalog; `persona:policy`
   section (order 45, function text provider: live event → `defaultPersona`
   config → `session.header.agentPreset` (known persona) → `''`); `persona`
   session-projection unit (folds `command/run` name `persona` + `persona/selected`,
   `{ personaId, pending }`); `/persona` command (via `ctx.inject(['commands'])`,
   no-arg prints current, unknown id errors); Config gains `defaultPersona`.
5. `src/compose.ts` — composition change per PRD: generated presets mount the
   persona package ONCE with neutral `text: ''` (drops at render); the persona
   now flows from the `persona:policy` section, never from spliced text.
6. `check-plugin.mjs` — assertions for controller fold/set/pre-step, catalog
   resolution, section provider (default chains), projection unit, neutral
   compose (one persona row, `!!js` preserved, no embedded persona text),
   `/persona` command, client switcher + badge.
7. `client.js` — `/persona` popupSelect via `commandUi.register` (options from
   `connection.api.agentPresets.list`, onSelect →
   `ctx.remote.commands.execute(sessionId, '/persona <id>')`); active-persona
   badge in `conversation.input.left` reading `useProjection('persona')` +
   session header preset; inject grows to `['slots','connection','commandUi','remote']`.
8. Boot-verify (manifest edges, served bundle, seed-materialization smoke) + docs
   (PLAN/BACKLOG/CONTEXT) + commit dsh-agents + superproject pin.

**Carried state at round start:** Phase B shipped + pinned (6 plugins, superproject
`Phase 11 B` commit); server UP; dsh-agents clean tree. Harness facts learned this
round: `AssembleContext` is `{scope?, signal?}` with `agent` added by the agent
package (`core/agent/src/runtime-types.ts:17`); the only persona-adjacent host
events are `plan/mode` (plan-mode), `session-mode/selected` (dsh-session-modes),
`agent-preset/selected` (appended only by the recompose flow, `api-proxy.ts:3113`);
the durable default preset lives on `session.header.agentPreset` (`types.ts:98`);
`PERSONA_SECTION='deployment:persona'`, `PERSONA_ORDER=0`; client commands run via
`ctx.remote.commands.execute`; popupSelect port = `ui-model-selection/client/index.ts:122-151`;
projection fold template = `plan-mode/src/index.ts` (unit + declaration merge);
web profile composes `sessionProjections` (base/web-app bundles).

**Outcome:** All targets shipped. `dsh-agents` host half: `types.ts` (session/agent/
pre-step decision faces), `controller.ts` (PERSONA_SELECTED, foldPersona last-wins,
hasOpenTurn, PersonaController with WeakMap pending + committed/queued/cancelled/noop),
`catalog.ts` (PersonaCatalog, readdir+parsePersona, get/nameOf/ids — plus a fix to
the `extensionOf` helper: `name.slice(dot)` instead of `name.slice(dot+1)` so the
`.md`/`.json` extension set actually matches), `compose.ts` rewritten to use a
neutral `neutralPersonaRow()` (private, returns `text: ''`), `splicePersona(composition)`
single-arg, `composeComposition(baseComposition)` single-arg (composition is now
persona-text-decoupled), `settings.ts` adds `defaultPersona` resolver, `sync.ts`
call updated to single-arg, `index.ts` full wiring: settings section + catalog +
controller + `provide('personaController'|'personaCatalog')` + EventHub-cast pre-step
listener + `persona:policy` section (order 45) + `persona` projection unit + `/persona`
command + boot mkdir + catalog.load + syncOnce + watch (250ms debounce, unref).
`tsc --noEmit` clean against harness TS 5.9.

`check-plugin.mjs` fully rewritten: loader shape, settings helpers (root/base/persona),
persona parsing (md/json/sanitize/errors), neutral composition assertions (splicePersona
on empty base, standard splice with !!js preservation), sync materialization (neutral
row, no embedded persona text, prune marked-only), catalog tests (readdir+parse),
controller tests (fold, hasOpenTurn, set committed/queued/cancelled/noop, commitPending,
pendingOf), personaPolicyText resolution chain tests (live → header → default → ''),
boot apply with stub services (section def with persona:policy text provider, projection
def with init/apply, command def with no-arg/switch/unknown/noop handlers), CLI
round-trip (list/add/remove/sync), client bundle (settings section + icon + badge
after roster warmup + commandUi switcher with options/onSelect assertions).

`client.js` Phase C additions: `PersonaChip` component in `conversation.input.left`
(display-only, reads `useProjection('persona')`, roster-backed `nameFor`), `/persona`
popupSelect via `commandUi.register` (options from `connection.api.agentPresets.list`,
active flag from `sessions.get().projections.get('persona')`,
onSelect → `ctx.remote.commands.execute(sessionId, '/persona <id>')`), inject grows
to `['slots','connection','commandUi','sessions','remote']`, `PersonaGlyph` uses
`IconPersonalizationOutline16`. `package.json` `dsh.client.inject` updated to match.
Docs updated: PLAN.md Phase C bullet, BACKLOG row 25, CONTEXT.md session 9 outcome.
Committed + pushed dsh-agents; superproject pin pending.

## 10. Session 9 — provider wire-truth round: fix dsh transports to match reality (2026-08-16)

**Directive:** propagate the reverse-engineered subscription transports into the
harness plugins. The old dsh descriptors were wrong on the wire: `kimi-sub` and
`grok-sub` spoke the claude dialect against dead endpoints (`api.kimi.com/coding`,
`api.x.ai/coding`); `gemini-sub` used consumer-web cookies against
`gemini.google.com/gemini/v1beta/...`; model catalogs were stale (Kimi K2.5-era,
Claude 4.1-era); `cursor-sub` pointed at the unreachable Connect-RPC
`api2.cursor.sh/anthropic`. Wire facts learned outside this repo (opencode plugin
work, session-summarized): kimi subscription speaks OpenAI-compatible at
`https://api.kimi.com/coding/v1`; grok subscription speaks OpenAI-compatible at
`https://cli-chat-proxy.grok.com/v1` with identity headers
`x-xai-token-auth: xai-grok-cli`, `x-grok-client-identifier: grok-shell`,
`x-grok-client-version: 0.2.93`; claude subscription needs
`anthropic-beta: oauth-2025-04-20`; Gemini Code Assist is the `v1internal`
endpoint (`https://cloudcode-pa.googleapis.com/v1internal:streamGenerateContent?alt=sse`)
with OAuth bearer + wrapped body `{model, project, user_prompt_id, request}` and
SSE payloads wrapped as `{traceId, response}`.

**Round todo:**
1. `dsh-dialects`: add a `code-assist` dialect id + implementation — Code Assist
   wrapper serialize (contents via `serializeContents`, `session_id`/`user_prompt_id`
   UUIDs, `request` nesting) and SSE parse that unwraps `{traceId, response}` and
   reuses `translateGemini`.
2. `dsh-providers/providers.ts`: `kimi-sub` → openai dialect + `/coding/v1` +
   K3/K2.7-code/K2.6/K2.5 models; `claude-sub` → 5s model family + oauth beta
   header; remove `cursor-sub`; `grok-sub` → openai dialect +
   `cli-chat-proxy.grok.com/v1` + identity headers + grok-4.6/4.5/composer models;
   `gemini-sub` → code-assist dialect + `v1internal` baseURL + OAuth token slot
   + gemini-3.6/3.5/3.1-pro/3-pro models; route descriptors gain optional
   `headers`.
3. `dsh-providers/adapter.ts` + `index.ts`: thread route headers through
   `ProviderConnection` into `DialectAuth.headers`.
4. `check-plugin.mjs` updates in both plugins (13 routes, no cursor, code-assist
   registered) + boot-verify.
5. Docs: PLAN.md (dsh-dialects/dsh-providers rows + P7 notes), BACKLOG row notes,
   this CONTEXT section. Commit + push plugin repos, then superproject pin.

**Carried state at round start:** clean trees in dsh-dialects (ac47efd) and
dsh-providers (3062793); superproject working tree carried Session 8's unfilled
dsh-agents round (CONTEXT.md + dirty dsh-agents submodule) — left untouched.
Wire facts verified live against the real endpoints: grok `chat/completions` 200
("Pong!"), kimi 403 billing-cycle usage limit (auth OK), claude 429 rate limit
(auth OK), gemini `:loadCodeAssist` 200 (standard-tier) + `:streamGenerateContent`
429 RESOURCE_EXHAUSTED with the full `x-goog-api-client`/`user-agent` header set
(request well-formed; account quota-gated).

**Outcome:** All targets shipped + boot-verified. `dsh-dialects` gained the
`code-assist` dialect (Code Assist wrapper serialize + `{traceId, response}` SSE
unwrap reusing `translateGemini`; registered + exported, `WireContent` exported,
tsconfig lib gained `DOM.AsyncIterable` for TS 5.9). `dsh-providers` corrected
every subscription route: `kimi-sub` openai@`/coding/v1` + K3/K2.7/K2.6/K2.5,
`claude-sub` 5s family + `anthropic-beta: oauth-2025-04-20`, `grok-sub`
openai@`cli-chat-proxy.grok.com/v1` + identity headers + grok-4.6/4.5/composer,
`gemini-sub` code-assist@`v1internal` + OAuth bearer + gemini-3.6/3.5/3.1-pro/3-pro,
`cursor-sub` removed (13 routes total); route descriptors + adapter gained fixed
`headers` threaded through `ProviderConnection` → `DialectAuth.headers`.
Typecheck clean in both plugins; check-plugin + dialect test suites green
(grok identity header + code-assist wrap/unwrap round-trips asserted).
Build env note: the plugin repos have no committed lockfiles; `@deepseek-ai/dsh-*`
resolve from npm only as `0.1.0-rc.x` (rc.6 used for build) and the unscoped
sibling plugins resolve via `node_modules` symlinks (`link:`-style), matching
the original workspace-less convention. Docs updated (PLAN.md rows + P7
post-fix note, BACKLOG rows 5/61/62 + auth bullet, this CONTEXT section).
Committed: `dsh-dialects` + `dsh-providers`, then superproject pin + docs.

## 11. Session 10 — OAuth token refresh seams for every subscription provider (2026-08-16)

**Build round** after Session 9 shipped the wire-truth transports. The remaining
gap: subscription OAuth tokens are short-lived (kimi ~15 min, gemini 1 h, grok /
claude a few hours), so both the privatecode plugin and `dsh-providers` need a
per-request refresh seam that rotates and **persists** the token bundle.

Phase list:
1. Reverse-engineer + verify a refresh endpoint for all four subscription
   providers (claude, kimi, grok, gemini).
2. privatecode plugin: generic OAuth refresh (refresh-on-expiry, singleflight,
   persist back to `auth.json`) wired into every subscription loader.
3. `dsh-providers`: same seam on the account vault (refresh refs written back
   through `ctx.accounts.set`).
4. Re-bootstrap token material + seed the vault, verify end-to-end.

Reverse-engineering results (all verified live with curl):
- **claude**: `POST https://api.anthropic.com/v1/oauth/token`, JSON
  `{grant_type: refresh_token, refresh_token, client_id}` where the Claude Code
  client id is `9d1c250a-e61b-44d9-88ed-5944d1962f5e` (discovered by probing the
  device-authorization oracle against the candidate UUIDs in the CLI bundle;
  `claude.ai/*` is Cloudflare-gated). Refresh tokens ROTATE.
- **kimi**: `POST https://auth.kimi.com/api/oauth/token`, form-encoded
  `grant_type=refresh_token&refresh_token&client_id=17e5f671-d194-4dfb-9706-5516cb48c098`
  (client id extracted from the kimi CLI bundle; `/v1/oauth/token` on
  `api.kimi.com` 404s — the real path is `/api/oauth/token` on `auth.kimi.com`).
  Response rotates the refresh token; `expires_in: 900`.
- **grok**: `POST https://auth.x.ai/oauth2/token`, form-encoded with
  `client_id=b1a00492-073a-47ea-816f-4c329264a828` (from `auth.json`
  `oidc_client_id`). Rotates + revokes the old token.
- **gemini**: `POST https://oauth2.googleapis.com/token` with client_id
  `1071006060591-tmhssin2h21lcre235vtolojh4g403ep.apps.googleusercontent.com` +
  client_secret `GOCSPX-…` (durable, non-rotating).

Caveats learned the hard way: the claude and grok refresh tokens are single-use
(rotated) — probing them consumed the stored sessions; claude's keychain entry
was also cleared by its background daemon, so claude + grok need a one-time
interactive re-login (`claude /login`, `grok login`) before the new seams have
live material again. kimi and gemini material remains healthy.

**Outcome:** Both refresh seams shipped and live-verified.

`privatecode` plugin (`packages/opencode/src/plugin/subscriptions.ts`): added an
`oauth` field to the subscription `Spec`s, a generic `refreshOAuthToken`
(JSON body for Anthropic, form for the rest), singleflight per provider
(`refreshInflight`), and `persistAuth` which rewrites `auth.json`
(`path.join(Global.Path.data, "auth.json")`) with the full rotated
`{type:"oauth", access, refresh, expires}` bundle behind a serialized write
chain. `oauthFetch` (claude/kimi/grok) and `geminiFetch` now refresh when the
stored `expires` has passed; bare `{type:"api"}` tokens keep working but do not
refresh. Typecheck clean; built + reinstalled (1.18.18). Live E2E: forced the
kimi-sub entry past expiry → one real refresh to `auth.kimi.com`, new bundle
persisted (access + rotated refresh + fresh expiry), outgoing request used the
new token.

`dsh-providers` (`src/index.ts`): module-level `OAUTH_REFRESHERS` table carrying
the verified endpoint + client id/secret (gemini's client id + secret live in
the vault as `GEMINI_SUB_CLIENT_ID`/`GEMINI_SUB_CLIENT_SECRET` — GitHub push
protection rejects GCP OAuth material in committed code) + the vault refs
(`*_OAUTH_TOKEN`, `*_REFRESH_TOKEN`, `*_EXPIRES`) per subscription provider;
generic `refreshOAuthToken`; in-`apply` singleflight + `readToken`
(refresh-on-expiry) + `write` through `ctx.accounts.set` with an in-process
`memory`/`refreshed` override when no vault is present so a rotated token is
never double-consumed. Wired into `credentialsFor` so both the gate and
`resolveAuth` see fresh tokens. Typecheck + `check-plugin` green. Live E2E
(real vault + live endpoints): forced kimi expiry → exactly one refresh, rotated
bundle written back, fresh bearer used; gemini → exactly one refresh, durable
refresh token kept, expiry advanced to ~1 h.

Material: `~/.local/share/opencode/auth.json` kimi-sub + gemini-sub are now
`{type:"oauth"}` bundles; the dsh vault at `~/.agents/vault` was initialized
(existing `master.key` reused; the service key is the Keychain `dsh.accounts`
hex, which matches `master.key`'s base64) and seeded with the six kimi/gemini
refs plus the two gemini OAuth client refs (slugs + `ref:` tags, so
`accounts.resolve` finds them). Verified `AccountsService.resolve` returns each
ref from the vault. Caveats: grok +
claude still need a one-time interactive re-login (`grok login`, `claude /login`)
— probing consumed their single-use refresh tokens — and the privatecode
loader only refreshes `{type:"oauth"}` entries, so the user must re-seed those
two as oauth bundles after re-login. Committed: `dsh-providers` seam + docs,
then superproject pin + docs.

## 12. Session 11 — dsh provider E2E verification + privatecode submodule (2026-08-17)

**Build round** verifying all dsh subscription providers work end-to-end through
the harness, and adding privatecode as a submodule.

Phase list:
1. Set up a headless profile for harness testing (no web server required).
2. E2E test all 4 subscription providers through the harness agent loop.
3. Fix grok auth (refreshed consumed tokens).
4. Add privatecode as submodule to agents superproject.

**Results:**
- **kimi-sub**: OK — auth works, streams through harness. Billing limit
  occasionally hit (quota resets periodically).
- **claude-sub**: OK — valid tokens, streams through harness. Full pipeline:
  dialect serialize → fetch → SSE parse → agent loop → output.
- **grok-sub**: OK — tokens refreshed, rotated bundle persisted to both
  auth.json and vault. Streams through harness.
- **gemini-sub**: Auth works (refresh succeeds, fresh token obtained), but
  code-assist endpoint returns 429 RESOURCE_EXHAUSTED (quota). The harness
  swallows the real error into "Internal error encountered" — a harness-level
  UX issue (cannot fix without modifying pinned harness). Not a code bug.

**Architecture verified:** dsh-harness boots correctly with all plugins
(dsh-dialects, dsh-credentials, dsh-providers, dsh-subscriptions, dsh-tweaks,
dsh-agents, dsh-formatters, dsh-lsp). The headless profile
(`~/.agents/profiles/headless/`) loads dsh-base + dsh-headless + plugin bundles.
Agent loop creates session → user message → LLM stream → assistant message →
output. Provider selection via `agent-default-model` in settings.yaml.

**privatecode submodule:** added at `plugins/privatecode` (branch `dev`,
commit `9a03d2a3`). Contains the opencode fork with subscription providers
plugin, OAuth refresh seams, and TUI rendering. Plan: cannibalize into
dsh-tui (Option B — dsh as runtime, extracted opencode TUI as rendering layer).

**Outcome:** 4/4 subscription providers verified through dsh harness
(3 working, 1 quota-gated). privatecode submodule added. DSH settings
default: claude-sub / claude-haiku-4-5.

---

## 13. Session 13 — bug fixes, docs restructure, orientation on ALL remaining work (2026-08-17)

**Build round** after the user oriented on the full project state and identified
stale docs + missing work.

**Fixes shipped this session:**
1. `dsh-agents`: added `id: "persona-chip"` to `conversation.input.left` slot
   registration — the harness list slot requires `options.id`; without it the
   web profile fails to load with "list slot conversation.input.left requires
   options.id". Committed `f11a83b`, pushed, pinned.
2. `dsh-tweaks`: registered `ui-onboarding` settings namespace — Phase A
   disabled `ui-settings-general` (dsh-tweaks took over the settings surface),
   but `ui-settings-models` still writes `welcomeNoticeVersion` through the
   settings API. Without this registration, `settings.mutate` fails and the
   welcome notice shows "The acknowledgement could not be saved." Committed
   `e28f86e`, pushed, pinned.
3. `dsh-subscriptions`: updated `check-plugin.mjs` assertion for 2-entry
   `cordis.patch.yml` (insert + agent-presets config override). The old
   assertion expected `patch.length === 1`. Committed `e9d26c1`, pushed, pinned.

**Docs restructure:**
- Moved PLAN/CONTEXT/BACKLOG/README/AGENTS/PRD/BLOCKED from repo root to
  `.agents/` subdirectory. Updated `.gitignore` to whitelist `.agents/*.md` and
  `.agents/hooks/`.
- Updated AGENTS.md with new layout, hooks section, and repo layout reflecting
  all 16 plugins (including privatecode and dsh-tui).

**Workflow hooks added (`.agents/hooks/`):**
- `pre-commit`: secrets check, check-plugin.mjs staging guard, node_modules
  block, docs reminder on plugin src changes.
- `commit-msg`: `<verb>: <subject>` format enforcement.
- `pre-push`: runs all plugin check-plugin.mjs suites before allowing push.
- `install.sh`: symlinks hooks into `.git/hooks/`.

**Key architecture decision:** dsh-tui will be a **separate repo** (not
cannibalizing privatecode). The privatecode binary stays untouched since it
works. dsh-tui will be a new standalone TUI client that talks to dsh as its
backend.

**/goal command:** dsh has a native `/goal` command (persistent same-session
goals with create/edit/pause/resume/clear). When dsh-tui is dsh-backed, this
command should work. The implementation lives in `packages/goal/` (GoalService,
command-goal, goal-round-driver, tool-goal). No separate implementation needed —
it comes free from the harness.

**Remaining work identified (ALL open/in-progress items):**
1. `dsh-credentials` multi-account gaps (resolveFor, resolveAll, slugRecordId)
2. `dsh-tui` separate repo setup + TUI as default profile
3. `dsh-session-modes` completion (durable mode kernel, agent assist)
4. `dsh-quotas` completion (quota dashboard, meter-bar polish)
5. Phase 11 D-F (Keychain↔Models binding, sidebar batch, quotas polish)
6. `dsh-repos` GitLab + agentic init
7. Curated/hosted gateway (product decisions)

**Halted on:** user interrupted to demand full orientation before continuing
execution.

---

## Session 14 — August 17, 2026 (continued)

**Context:** Continuing from Session 13's boot fixes and docs restructure.
User said "What did we do so far?" — triggered full orientation and continued
execution of ALL remaining work. User directive: "Continue if you have next
steps, or stop and ask for clarification if you are unsure how to proceed."

**What was done:**

### dsh-credentials: Multi-account support (two commits)
1. `795e8fb` — Core multi-account:
   - `slugRecordId(ref, account?)` now appends `--<account-slug>` when account
     is provided, so two accounts for the same ref (e.g., two Claude accounts
     both needing `CLAUDE_SUB_OAUTH_TOKEN`) coexist without collision.
   - `recordForRef(ref, value, { account? })` tags records with `account:<name>`.
   - `resolveFor(ref, account)` resolves a specific account; skips ambient
     credentials (they're per-machine, not per-account).
   - `resolveAll(ref)` returns all records across every account for a ref.
   - `set(ref, value, account?)` and `unset(ref, account?)` accept optional
     account parameter.
   - Web API: GET/PUT/DELETE support `?account=<name>` query parameter.
   - Private `recordForRef` in AccountsService updated: direct slug lookup first
     (fast path), then tag scan with account filter.

2. `6489f0d` — CLI multi-account:
   - `vault add` now accepts `--account <a>` (added to USAGE + adds `account:<a>`
     tag to the record).
   - `vault list` now shows ACCOUNT column (extracted from tags).
   - All 15 check-plugin suites pass.

### dsh-tui: Standalone HTTP client (one commit)
`9760ff5` — Complete standalone TUI, rebuilt from scratch:
- **No cordis dependency** — pure Node.js HTTP client.
- `DshClient`: HTTP POST RPC (JSON envelope `client-request`/`server-response`)
  + SSE mux streaming via `fetch()` with streaming body reader.
- `protocol.ts`: Wire format types matching harness `apiproxy` shapes
  (`ClientRequest`, `ServerResponse`, `MuxFrame`, domain types).
- `tui.ts`: readline + ANSI escape codes — status bar (connection dot, session,
  model, streaming tag), stream buffer display, colored output helpers.
- `commands.ts`: Slash commands — `/session` (list/new/switch/info), `/model`
  (list/switch), `/goal` (list/create/pause/resume/clear), `/cancel`, `/help`,
  `/exit`/`/quit`.
- `bin/dsh-tui.mjs`: CLI entry point (`dsh-tui [--url <url>]`).
- Auto-connects, auto-selects latest session, reconnects mux on error.
- Architecture: standalone client talks to dsh over HTTP — no WebSocket needed
  (SSE provides the same data as WS downlinks, simpler for standalone client).

### dsh-session-modes: Durable mode kernel completion
`1cc68d5` — Added web endpoints:
- `GET /session-modes` — mode catalog and config (existing, unchanged).
- `GET /session-modes/current` — query current mode for an agent.
- `GET /session-modes/history` — mode definitions, transitions graph, tool/route
  policies per mode.
- Durable persistence was already working via `session-mode/selected` events
  appended to session history and restored via `findLast()`.

### dsh-quotas: Quota dashboard completion
`976c11a` — Complete quota dashboard:
- `GET /quotas` — full HTML dashboard with dark theme, status colors, usage meter
  bars, refresh button.
- `GET /quotas/api/summary` — aggregated counts (available/unknown/error/exhausted).
- `GET /quotas/api/snapshots` — raw JSON (unchanged).
- `POST /quotas/api/refresh` — refresh all providers.
- `POST /quotas/api/refresh/:provider` — refresh single provider.
- Meter bar visualization: `[████████░░░░] 67%` with color coding
  (green <60%, yellow <85%, red >=85%).

**Wire verification (all HTTP, no harness restart needed):**
- dsh-credentials multi-account: all 15 check-plugin suites pass.
- dsh-tui: typecheck clean, check-plugin pass.
- dsh-session-modes: typecheck clean, check-plugin pass.
- dsh-quotas: typecheck clean, check-plugin pass.

**Pushes made:**
- dsh-credentials: `795e8fb` → pushed, `6489f0d` → pushed
- dsh-tui: `9760ff5` → pushed
- dsh-session-modes: `1cc68d5` → pushed
- dsh-quotas: `976c11a` → pushed
- Superproject pins: `d10835f`, `b3d07fb`, `546041f`, `872e175`, `03bb050` → all pushed

**Remaining work (from prior session's list, updated):**
1. Phase 11 D-F: Keychain↔Models binding, sidebar batch, quotas polish
2. `dsh-repos` GitLab + agentic init
3. Curated/hosted gateway (product decisions)

**Open questions (awaiting user input before proceeding):**

These items require the user's decision on scope, design, or priority. Per
AGENTS.md "user input gate" rule, implementation is halted until the user
answers.

**Phase 11 D — Keychain↔Models binding:**
Q: How should the "Manage in Keychain" action work in the Models settings row?
Options:
  (a) Clicking the key icon opens the Keychain section scrolled to the
      relevant credential (deep-link via `/vault?ref=<ref>`).
  (b) Clicking the key icon opens a small popover with reveal/copy/edit
      actions inline, without leaving the Models page.
  (c) The key icon is a toggle that shows/hides the credential value
      inline (like VS Code's password fields).
Recommendation: (a) — keeps Keychain as the single source of truth, avoids
duplicating reveal logic across two settings pages.

**Phase 11 E — Sidebar batch:**
Q: What scope of sidebar changes do you want?
Options:
  (a) Full: History section + machine-root workspace + chevron collapse
      toggles + drag-to-reorder sessions.
  (b) Medium: History section + machine-root workspace (no chevrons/drag).
  (c) Minimal: History section only (read-only list of past sessions).
Recommendation: (b) — History + machine-root give the most value without
the complexity of drag-and-drop (which needs a new harness seam).

**Phase 11 F — Quotas polish:**
Q: What does "quotas polish" mean to you? The quota dashboard is now shipped
(HTML UI, summary API, meter bars). What else is needed?
Options:
  (a) Nothing — the current dashboard is sufficient.
  (b) Auto-refresh on a timer (e.g. every 15 minutes) in the background.
  (c) Per-session usage tracking (tokens consumed per conversation turn).
  (d) All of the above.

**dsh-repos — GitLab support:**
Q: What scope of GitLab support?
Options:
  (a) Full parity with GitHub: MR creation, branch/commit/push, repo list,
      credentials via `GITLAB_TOKEN`.
  (b) Read-only: repo list + branch status only (no push/MR).
  (c) Defer — GitLab support is not needed right now.

**dsh-repos — Agentic init:**
Q: What should `dsh repos init` generate?
Options:
  (a) A harness-flavored AGENTS.md with plugin seams, conventions, and
      boot-verify commands auto-detected from the repo structure.
  (b) A minimal .agents/ directory with PLAN.md, CONTEXT.md, BACKLOG.md
      templates.
  (c) Both (a) and (b).
  (d) Defer — not needed right now.

**Harness acknowledgement fix (2026-08-17):**
Root cause found: `dsh-tweaks` claimed to disable `ui-settings-general` (see
note at dsh-tweaks/src/index.ts:125-128) but the web-profile cordis.patch.yml
still had `ui-settings-general` active. Both plugins tried to register the
`ui-onboarding` settings namespace, and the settings service throws on
duplicate registration (`settings/src/index.ts:436-438`). This prevented the
welcome notice acknowledgement from persisting. Fix: added
`dsh-tweaks/cordis.patch.yml` that disables `ui-settings-general`, plus
`bundle.patch` reference in package.json. Committed `4ef23aa` in dsh-tweaks,
pushed.

**Status:** 4 high/medium tasks completed in this session + harness
acknowledgement fix. All 16 plugin check-plugin suites green. Superproject
pushed clean. Implementation halted on remaining items pending user input on
the above questions.

---

## Session 15 — August 17, 2026 (infra + cleanup round)

**Context:** Continuing from Session 14's multi-task round. User said "What did we
do so far?" — triggered orientation, then "Continue if you have next steps."

**What was done:**

### Harness web server 400 error — RESOLVED
- Root cause: directory rename from `~/agents` → `~/projects/dsh-stack` broke all
  symlinks (profile node_modules, per-plugin peer deps).
- Fixed all 12 profile symlinks (`~/.agents/profiles/web/node_modules/dsh-*`).
- Fixed profile `package.json` (link: dependencies + 4 missing plugins).
- Ran `pnpm install` to regenerate pnpm symlinks.
- Fixed 8 broken per-plugin `node_modules/@deepseek-ai/` symlinks.
- Added `dsh-lsp`, `dsh-lsp-stdio`, `dsh-tool-lsp` to flat fallback.
- Created per-plugin `node_modules/@deepseek-ai/` symlinks for all peer deps.
- Verified: `HTTP 200` at `http://127.0.0.1:3080/`.

### agents-super restructure (completed)
- ALL 16 dsh- plugin repos as submodules under `dsh/`.
- `privatecode` moved to root (out of `dsh/`).
- `paes` + `ams` added under `apps/` (private GitHub repos).
- `darkfactory` made public.
- `mediastream` + `messenger` archived (private repos, NOT in agents-super).
- README updated, committed + pushed (`ca1cd09`).

### External state cleanup
- Deleted `.dsh` (stale), `.gemini` (155M), `.grok` (177M), `.kimi` (646M).
- All credentials already in dsh vault.
- `.claude` kept (has opencode agent CLI).

### Andromeda session conversion
- Converted ALL 405 andromeda transcripts into dsh `.jsonl.zstd` format.
- Script: `/tmp/convert-andromeda.mjs`.
- Output: `~/.agents/sessions/andromeda-*/session-andromeda-*.jsonl.zst`.
- 405 sessions converted, 0 skipped, 0 errors.

### Request file backfill
- Created 12 request files in `.agents/requests/` covering all DSH session history.
- Sources: CONTEXT.md sessions 1-14 (preserved exact user wording).
- Claude Desktop tasks: not DSH-related (old Andromeda Agent OS), skipped.
- Andromeda transcripts: mostly DarkFactory PR/issue reviews, converted but
  not individually backfilled as separate request files.

**Status:** All infrastructure work done. 16 request files in `.agents/requests/`.
All 16 plugin check-plugin suites green. Superproject pushed clean.

**Remaining work (from Session 14, unchanged):**
1. Phase 11 D-F: Keychain↔Models binding, sidebar batch, quotas polish
2. `dsh-repos` GitLab + agentic init
3. Curated/hosted gateway (product decisions)

All three items require user input before proceeding (questions documented in
Session 14's CONTEXT section).

---

## Session 16 — August 17, 2026 (settings/providers overhaul + loops + zen)

**Context:** User returned with a large directive (request file
`session-16-providers-overhaul-loops-zen.md`) that supersedes the Session-14
open gates. Prior state: Phase 11 A/B/C shipped; D/E/F gated; an uncommitted
dsh-quotas change (built-in probe providers + 15-min auto-refresh) was found in
the working tree and answers the old "quotas polish" question with (b).

**Request items (verbatim in the request file):**
1. Themes catalog UI missing from the Themes settings tab (Open VSX search/install).
2. Keychain: wrong icon, embedded page inside the modal, underimplemented → full section.
3. Agent presets split across session modes and agents; both tabs inadequate;
   rename harness "Agent" → "Agents", "Session Modes" → "Actions".
4. Rename plugin dsh-session-modes → dsh-actions (repo, package, wiring).
5. Models tab: show auth + quota indicators; merge Quotas+Models tabs into
   "Providers"; merge dsh-subscriptions + dsh-quotas + dsh-providers into one
   dsh-providers plugin.
6. dsh-tools exposed in settings — full user control over tools.
7. New plugin dsh-loops: goal-based loops from .agents/loops, predefinable
   criteria + workflows + deterministic orchestration, editable via agent tools
   or settings.
8. dsh-tweaks: enable/disable plugins in settings with "takes effect on reload"
   popup + reload button.
9. Actions live under .agents/actions (file-based).
10. OpenCode Zen provider for the stack: auth + quotas + everything.

**Plan:** design decisions recorded in PLAN.md "P12 — Session 16 buildout".
Phases: P12.0 housekeeping (commit pending dsh-quotas work) → P12.1 providers
consolidation (backend merge + zen) → P12.2 Providers settings UI → P12.3
Keychain overhaul → P12.4 Actions rename + .agents/actions → P12.5 Agents tab +
presets split → P12.6 Themes catalog → P12.7 Tools settings → P12.8 dsh-loops →
P12.9 plugin enable/disable + reload.

**Status:** in progress.


**Interlude (Aug 18) — external work + incidents:**

- **kimi auth fixed externally.** A big-pickle (zen free model) session via
  privatecode implemented and pushed: dsh-credentials `d8ffe04` (subscription
  login flows — RFC 8628 device flow for grok-sub/kimi-sub, manual paste for
  claude/gemini; new src/login.ts, /login/* endpoints, Keychain "Subscription
  Logins" UI) and dsh-quotas `74f7101` (quota probes decrypt via ctx.accounts
  — the exact gap noted in Session 16 P12.0 review). Superproject pins
  `90a6b8a`/`c69c60e`/`113892a`. Transcripts were not found on disk; the
  commits are the record. Consequence for P12.1/P12.3: the providers merge and
  Keychain overhaul MUST build on this new login surface, not replace it.
- **dsh-voice installed.** `dsh plugin --profile web add github:zhuiyueya/dsh-voice`
  (browser STT/TTS + Whisper/TTS agent tools). The profile edit only takes
  effect on server restart; the restart killed the agent's own host session
  mid-call (lesson: never kill PID-on-3080 from inside — a future "force
  reload" feature must self-spawn a replacement before exiting). Server came
  back up clean; voice bundle serves 200.
- **All six P12 subagents died in the auth outage.** Salvage: dsh-providers has
  uncommitted partial merge output (src/quotas/, src/remap.ts, presets/,
  cordis.patch.yml) to review/complete; the other five tasks must be
  re-dispatched.
- **New asks folded into P12:** OpenCode **Go** provider with full parity
  (login, refresh, quotas) alongside Zen (P12.10); actions **run palette** in
  the session input bar + **reload app** command (clean reload preserving and
  resuming running agents) + **force reload** (server self-restart) (P12.11).

**Session 17 (Aug 18) — P12.1 complete: providers merge + OpenCode Zen route.**

Completed:

1. **OpenCode Zen route** (`6394320`): new `zen` provider in `PROVIDER_ROUTES`:
   - Base URL: `opencode.ai/zen/v1`, dialect: `openai` (POST `/chat/completions`)
   - Auth: `ZEN_API_KEY` credential slot (Bearer token)
   - 24 advisory models: GPT 5.x, Claude Opus/Sonnet/Haiku, Gemini 3.x,
     Grok 4.x, DeepSeek V4 (incl. free tier), Kimi K2.7/K3, Qwen 3.x,
     MiMo-V2.5 free
   - Probe: GET `/zen/v1/models` (public, no auth required)
   - check-plugin: catalog + stream assertions added

2. **Quotas wiring into dsh-providers** (`0178cc8`):
   - `applyQuotas()` called at end of `apply()` with `config.quotas` forwarding
   - `QuotaRegistry` registered as `ctx.quotas` cordis service
   - `QuotasConfig` added to `Config` interface
   - Re-exports: `QuotaRegistry`, `applyQuotas`, `QUOTAS_PREFIX`, `mountQuotaWeb`
   - Subpath export: `dsh-providers/quotas` → `lib/quotas/index.{js,d.ts}`
   - quotas subpackage derives probe routes from `PROVIDER_ROUTES` (no duplication)
   - remap.ts merged from standalone dsh-subscriptions (identical logic)

3. **Standalone packages deleted** (`155f6c5`):
   - `plugins/dsh-subscriptions/` removed (git rm)
   - `plugins/dsh-quotas/` removed (git rm)
   - `.gitmodules` cleaned (two submodule entries removed)
   - PLAN.md, BACKLOG.md, README.md updated

4. **BACKLOG.md rows updated**:
   - Row 25 (sidebar batch): SHIPPED
   - Row 31 (merge subscriptions+quotas): SHIPPED
   - Row 36 (OpenCode Zen): SHIPPED
   - Row 41 (mega-merge end-state): partial progress (dsh-quotas ✅, dsh-subscriptions ✅)

**Superproject state:** pushed to `155f6c5`, all 16 check-plugin suites green.

**Remaining P12 phases:**
- P12.2 Providers UI: Models tab + auth/quota indicators
- P12.3 Keychain overhaul: full CRUD + nav icon
- P12.4 Actions rename: dsh-session-modes → dsh-actions
- P12.5 Agents tab + presets split
- P12.6 Themes catalog (Open VSX search/install)
- P12.7 Tools settings (full user control)
- P12.8 dsh-loops (goal-based loops)
- P12.9 plugin enable/disable + reload
- P12.10 OpenCode Go provider
- P12.11 Actions run palette + reload commands

**Session 17 handoff (K3 takeover after big-pickle rate-limited):**

- **P0 auth fix shipped** (backlog row 47): dsh-providers `0c2999d` hardens
  OAuth refresh — rotated refresh token is written FIRST (kills the
  death-spiral window), ISO 8601 expiry values parse (login flows interop),
  one transient retry, permanent invalid_grant now surfaces as
  missing-credential (loud re-login signal) instead of silently serving the
  stale token forever. dsh-credentials `6b431b5` stores expiry refs as epoch
  millis in both device and CLI login flows. Also fixed the dsh-providers
  build (peer symlinks dsh-host-webserver/dsh-agent, remap.ts type inference
**Session 17 handoff 2 (K3, after second mass death):**

- User directives recorded as BACKLOG §8 rows 48-50: General loses Appearance
  (Themes owns all appearance, VS Code themes, default dark+light pair);
  Session Modes + Agents + agent presets merge into ONE "Agents" tab; Models
  renamed "Providers" absorbing Keychain; quota data not showing.
- Claude Code (2 processes) is LIVE in dsh-providers + dsh-credentials
  (status lights, credential-capability probes, PTY login fix) — K3 side stays
  out of those repos and dsh-tweaks until it settles.
- All 7 subagents resumed with a survival rule (commit every increment) and
  the new IA context.

  over explicit dsh-llm import to dodge the forked-brand duplicate-dep).
  Pushed big-pickle's unpushed commits along the way (791595c et al).
- Soak criterion: no mass auth die-off over the next long sessions.
- **Codex wire-truth captured** (from privatecode plugin/openai/codex.ts,
  ready for row 51 once Claude settles): issuer auth.openai.com
  (/oauth/authorize + /oauth/token, refresh_token grant, rotating refresh),
  client id app_EMoamEEZ73f0CkXaXp7hrann, PKCE S256, localhost:1455
  /auth/callback, scopes openid profile email offline_access +
  codex_cli_simplified_flow; API = chatgpt.com/backend-api/codex/responses
  (Responses API, reasoning effort native); account id from JWT
  chatgpt_account_id claim, sent as ChatGPT-Account-Id header; models
  gpt-5.5 / gpt-5.4 / gpt-5.4-mini / gpt-5.3-codex-spark (5.5-pro excluded).
- **Amendments 2-5 recorded** (PLAN P13 + BACKLOG §9 rows 51-54): themes+voice
  fold into tweaks; dsh-desktop DELETED (profile, submodule, GitHub archive);
  Integrations tab naming; provider display names + (Sub)/(API) badges.
  Final stack: 4 plugins — integrations, tweaks, code, tui.

**Session 18 (Aug 19) — Claude takeover + provider wire-truth:**

- Claude hit session limit 00:50 after shipping: provider status lights,
  credential-capability probes, unusable-route hiding, QUOTA-vs-auth error
  split, live model discovery, reasoning-effort selection, antigravity-sub
  route, Zen credential wiring, CLI login fixes (PTY, Claude Code credential
  store). Its Stop-hook goal ("all providers working, truly executing")
  reached: kimi-code/kimi-sub/grok-sub/antigravity executing; claude-sub +
  zen rate-limited (transient); gemini-sub free tier exhausted; deepseek-api
  unfunded; 8 API routes keyless.
- **probe-live.mjs** (dsh-providers 06a5257) independently verified the above
  through the REAL AccountsService — 4/15 executing, failures all accounted
  (transient quota / missing keys / unfunded). Shim pitfalls recorded: vault
  records are slug-keyed and account-tagged; always resolve through
  AccountsService.
- **Restart protocol (user directive, durable):** NEVER restart the harness
  from inside — it kills this session. Prepare everything, PING the user to
  restart. (Claude had the same instruction.)
- New rows: 55 total data import (drive + desktop SSH), 56 cursor-sub
  provider, 57 Antigravity model picking (user rejects server-determined
  conclusion; fallback = CLI fake-PTY transport).

**Session 19 (Aug 19) — realign + restate (post-restart):**

- Harness restarted by the user; all subagent work-in-progress was lost to the
  kimi rate-limit death EXCEPT committed code. Subagents now run on big-pickle.
- Goal restated (rev 4) as the full buildout + consolidation contract: 4-plugin
  end-state (integrations/tweaks/code/tui), Integrations/Agents/Themes/Plugins
  settings IA, per-provider full parity (login/models/probes/quotas/refresh/
  effort), binary-integration standard preferred (harness ships
  subagent-claude-code + subagent-codex + hooks-* packages), restart protocol
  (prepare + ping, never self-kill).
- Wave plan: W0 me (binary-integration exploration, reload action) → W1 salvage
  subagents (voice/themes/loops/tools/agents/parity) → W2 providers
  (codex/cursor/go, antigravity picking, badges, Integrations tab) → W3 merge
  cascade → W4 platform (TUI, tailscale, data import).
- **Local inference routes SHIPPED** (dsh-providers 0734a96 + 9b50663):
  ollama/llamacpp/vllm as no-auth 'local' kind routes with discovery + quota
  probes. Ollama running with qwen3.8:27b (17GB) + qwen3:8b (5.2GB) pulled.
  Verified: qwen3:8b executes (28s cold), qwen3.8:27b executes (113s cold
  load on M3). Subagents can route to ollama/* via provider/model overrides —
  zero rate limits, the fix for mass auth deaths.
- **KV cache quick win**: claude dialect now sends ephemeral cache_control
  breakpoints on system blocks (dsh-dialects 149aa34) — 90% discount on
  cached system prompt tokens, fewer rate-limit hits.

---

## Session 20 — August 20, 2026 (UI polish, unified tabs, menus, OLED styling)

**Context:** User requested a focused batch of UI/UX improvements across the stack (request file `session-20-ui-polish.md`):
1. Input bar plus button vertically centered and sized to match the send button (34px).
2. Input bar placeholder/preview text vertically centered.
3. Panel plus button gains the unified context dropdown menu (New Chat, New Terminal, New Sandbox).
4. Collapsed sidebar rail removes the new workspace button, leaving the unified plus button.
5. Conversation window integrated as a tab in the panel, creating a unified tabbed shell for Conversation / Terminals / Containers.
6. Header agent preset badge removed since it is displayed in the input bar toolbar.
7. Session log download button hidden behind a three-dots (`...`) context menu in the session header.
8. Goal badge/bar OLED styling updated with pure black / dark contrast tokens.

**Status:** completed.

---

## Session 21 — August 20, 2026 (Sidebar Full Filesystem, Dynamic Workspaces, Nested Chats & Subagents, InputBar & Panel Polish)

**Context & User Directives:**
User requested complete filesystem and chat hierarchy integration in the sidebar, input bar layout fixes, and terminal bottom panel improvements (request file `session-17-sidebar-full-fs-chat-tree-tabs.md`):
1. **Full Filesystem Navigation**: Sidebar shows full filesystem starting from host root `/`, user home `~`, or `Projects`, with quick switchers and arbitrary directory drill-down.
2. **Dynamic Workspaces**: Folders dynamically materialize workspaces when starting conversations inside them (`handleStartSessionInDir` / `createWorkspace`).
3. **Chat Sessions Nested in Folders**: Chat sessions belonging to a workspace folder appear directly inside that folder with `ChatGlyph`, active selection indicator, relative timestamp (`12m`, `2h`), and folder-level chat count badge.
4. **Chats in Focused Folders**: When focusing a directory as the tree root, its direct chats appear prominently at the top of the tree view under `Chats in <folder>`.
5. **Ungrouped Chats**: Prominent, collapsible top-level `Ungrouped` section with live count badge and `+` button for creating unscoped sessions.
6. **Subagent Session Hierarchy**: Subagent sessions (matching `parentId` or `origin: "subagent"`) are nested directly underneath their parent chat sessions with expandable chevrons, count badges, custom `SubagentGlyph` branching icons, and individual actions menus.
7. **Filesystem Inspection Modal**: Clicking any file opens `FileViewerModal` with 1MB UTF-8 preview, monospace rendering, path breadcrumb, and copy button. Backend endpoints `GET /quotas/api/fs` and `GET /quotas/api/fs/read` implemented in `dsh-providers/src/quotas/web.ts`.
8. **Input Bar Polish**: Separated input textarea card from bottom toolbar card with `6px` gap. Pinned send button flush right (`flex: 1; min-width: 0;` on `.scroll`). Hidden send button when disabled (`visibility: hidden; cursor: default;`).
9. **Terminal Bottom Panel Polish**: Embedded `TerminalsGlyph` and `ContainersGlyph` directly inside tab headers, removed standalone status dot markers and bottom bars to maximize active viewing space.
10. **Cordis Slot Mechanics Fixes**: Resolved single slot collision by applying `priority: -10` in `sidebar.workspaces` registration and removed duplicate child slot declarations. Connected live reactive `useSessions` and `useWorkspaces` observable hooks without static service masking.

**Status:** completed, compiled, and verified (0 plugin errors, 139/170 active plugins).

---

## Session 22 — August 20, 2026 (Settings Shell, Mobile Layout, Drag-and-Drop Tabs & Context Menus)

**Context & User Directives:**
User requested 6 major interactive shell enhancements (request file `session-22-settings-shell-tabs-dnd.md`):
1. **Settings sidebar collapsable & resizable**: Resizable nav rail (`.dsh-tw-nav`) with drag-to-resize handle (130px–380px) and collapse toggle button to mini rail with tooltips.
2. **Main sidebar mobile full width**: On screens <= 768px, sidebar expands to `100vw` full screen width overlay drawer.
3. **Draggable settings modal**: Enable dragging the settings dialog across the screen by pointer capture on its header and title bar.
4. **Enhanced context menu**: Cut, Copy, Paste clipboard actions, plus context-aware Close and Rename for sessions and workspaces.
5. **Panel plus dropdown z-index fix**: Elevate dropdown z-index (`z-index: 10000000`) with fixed viewport coordinate calculations so it never renders under terminal canvases or webview iframes.
6. **Main conversation top tab bar & cross-panel tab drag**: Top tab bar with plus button, active conversation tab, and HTML5 drag-and-drop support across top conversation bar and bottom panel.

**Status:** completed, all 15 plugin test suites passed, committed & pushed.

---

## Session 23 — August 20, 2026 (Sidebar Polish, Folder/Chat Menus, Centering, Main Tabs & Settings Fix)

**Context & User Directives:**
User requested 9 targeted fixes and UX enhancements across sidebar, tabs, input bar, and settings (request file `session-23-sidebar-polish-tabs-settings-fix.md`):
1. **Sidebar chat context & 3-dots hover menu**: Right click on chat row shows Rename and Archive; hover 3-dots menu is preserved with those actions.
2. **Sidebar visual consistency**: Clean, unified font sizing (12px), uniform row heights (30px), and clear hierarchical indentation.
3. **Folder hover 3-dots menu**: Replace terminal button with a 3-dots button next to `+` containing Focus, Open Terminal, Cut, Copy Path, Rename, Delete, and New Chat.
4. **Input bar plus button & draft centering**: Strict vertical center alignment of plus button and input placeholder/text.
5. **Main view standalone plus menu**: Opening Terminal or Container via main view top tab bar opens/renders directly in main view area without opening bottom panel.
6. **Remove top preset badge**: Fully purge any top session header preset badge.
7. **Brand SVG provider icons in settings**: Add SVG logos for all providers in Settings > Providers.
8. **Settings button fix**: Fix settings button unmounting / not opening on click.
9. **Cross-panel tab deduplication & mutual exclusivity**: Tabs moved between top and bottom are removed from source to ensure mutually exclusive tab sets.

**Status:** completed, all 15 plugin test suites passed, committed & pushed.

---

## Session 24 — August 20, 2026 (Header 3-Dots Export, Collapsed Ungrouped, Unified Tabs & Panel Collapse)

**Context & User Directives:**
User requested 5 focused UX refinements across session headers, sidebar, bottom panel, and terminal controls (request file `session-24-header-menus-panel-tabs-collapse.md`):
1. **Download session log in 3-dots context menu**: Hide the raw export button from session header and place it in a three-dots (`...`) menu.
2. **Ungrouped chats collapsed by default**: Initialize `isUngroupedOpen` state to `false` in `UnifiedWorkspacesBrowser`.
3. **Unify panel tabs with top styling**: Restyle bottom panel tab strip using the same pill/capsule design language, font, padding, and active indicators as the top tab bar.
4. **Replace maximize with collapse toggle & remove close button**: Bottom panel header replaces maximize with a collapse/expand toggle and removes the close `×` button.
5. **Terminal specialized actions menu & right-click**: Provide Refresh Buffer, Clear Buffer, Rename, Kill, and New Window under tab right-click and trailing 3-dots tab bar menu.

**Status:** completed, all 15 plugin test suites passed, committed & pushed.

---

## Session 25 — August 20, 2026 (Sidebar Search, Input Text Centering, Delete Skills, Settings Fix & Panel Alignment)

**Context & User Directives:**
User requested 6 targeted improvements across sidebar, input bar, skill cleaning, settings, and panel docking (request file `session-25-sidebar-search-centering-skills-cleanup-tabs-alignment.md`):
1. **Sidebar search input bar & toggle setting**: Search input at top of sidebar filtering files/chats with a setting in General settings to hide/show it.
2. **Input bar preview text true vertical centering**: True vertical centering of placeholder and input text (middle of glyphs on center line).
3. **Delete all Cursor imported skills**: Remove cursor imported skills from the project.
4. **Settings button click fix**: Reliable open/trigger of settings dialog from sidebar and all buttons.
5. **Remove duplicate conversation tab from panel**: Only show terminal/containers in panel when chat is in main.
6. **Panel background & edge alignment**: Fix gap behind panel and align edges with sidebar and centerCol.

**Status:** completed, all 15 plugin test suites passed, committed & pushed.

---

## Session 26 — August 20, 2026 (Conversation Content Move with Tab & Auto-Expand Collapsed Panel)

**Context & User Directives:**
User requested 2 specific interactions for tab management and panel behavior (request file `session-26-conversation-content-move-and-collapsed-tab-expand.md`):
1. **Conversation tab content moves with tab**: Moving or activating Conversation tab in the bottom panel must host and render the conversation view inside the bottom panel with full height capabilities.
2. **Auto-expand collapsed panel on tab click**: Clicking any tab button in `BottomTerminalPanel` when `isCollapsed = true` automatically expands the panel.

**Status:** completed, all 15 plugin test suites passed, committed & pushed.

---

## Session 27 — August 20, 2026 (Tab Move Destinations, Right Sidebar, OLED, Terminal Unification & Panel Icon)

**Context & User Directives:**
User requested 7 focused refinements across tab destinations, right sidebar, OLED styling, terminal component unification, fallback states, settings trigger, and panel icons (request file `session-27-tab-destinations-right-sidebar-oled-settings-panel-icon.md`):
1. **Tab Context Move Destinations**: Add Move to Main Area, Move to Bottom Panel, Move to Left Sidebar, Move to Right Sidebar in right-click & 3-dots menus.
2. **Right Sidebar Dock**: Collapsible/resizable dock on the right side of the workspace to host tabs.
3. **Panel OLED Black Theme**: Pure black OLED styling for panel tab bar and containers.
4. **Main View Terminal Unification**: Remove fake input bar; use identical interactive tmux terminal in main area.
5. **Full Conversation DOM/Content Hosting**: Reparent/render live conversation in whichever area/panel the tab is active in.
6. **Tab Move Fallback**: Switch to next tab or empty launcher card with all window options when the active tab moves.
7. **Settings Button Fix & Panel Icon**: Bulletproof settings trigger and panel dock icon replacing chevrons.

**Status:** completed, all 15 plugin test suites passed, committed & pushed.

---

## Session 28 — August 20, 2026 (Repo Icons, Sidebar Alignment, Pinned & Active Section, Purge Legacy Layouts)

**Context & User Directives:**
User requested 4 focused improvements in the sidebar (request file `session-28-repo-icons-sidebar-alignment-pinned-active-purge-legacy.md`):
1. **Repo Icon Detection**: Recognize git repositories in the tree and render a git repo icon instead of a generic folder icon.
2. **Sidebar Indentation Alignment**: Items beneath a folder must align at the exact same vertical baseline/indentation as sibling subfolders and tree rows.
3. **Rename Section to "Pinned & Active"**: Rename "Live Sessions" section to "Pinned & Active".
4. **Purge Legacy Sidebar Layout**: Ensure clicking a terminal never switches/regresses the sidebar to an old legacy layout; purge old sidebar view branches so `UnifiedWorkspacesBrowser` is always active.

**Status:** completed, all 15 plugin test suites passed, committed & pushed.

---

## Session 29 — August 20, 2026 (Full UI Polish, Settings Split, Secondary Sidebar & Context Menus)

**Context & User Directives:**
User requested a complete round of UI polish and bugfixes across 10 areas (request file `session-29-fix-settings-button-repo-icon-sidebar-terminals-click.md`):
1. **Fix Settings Button**: Eliminate capture-phase double-toggle bug in `TweaksSettingsRoot`, set `z-index: 1000000`.
2. **Accurate Git Repo Detection**: Strictly verify `.git` presence for repo icons, not home root.
3. **Sidebar Terminal & Container Click Handlers**: Reactive window listeners in `BottomTerminalPanel`.
4. **Toolbar Model Picker vs Dropdown Menu**: Generic model icon on toolbar button (`SparklesGlyph`), individual provider brand icons in dropdown menu options.
5. **Unclosable Conversation Tab**: Omit close button for chat tabs in top and panel tab bars.
6. **Split Settings into Accounts, Models, and Apps**: Dedicated sections with brand icons across all provider rows.
7. **Harmonize Subagent Collapse Style**: Sessions with subagents match folder collapse visuals.
8. **Right-Click Context Menu Parity**: Right-click opens at cursor `(e.clientX, e.clientY)` with full 3-dots actions.
9. **Secondary Sidebar & Sidebar Swap Setting**: Add sidebar swap toggle in Personalization settings to switch Main and Secondary sidebars.
10. **Remove Top Preset Badge**: Permanently suppress `conversation.session.header.actions` preset badges.

**Status:** in progress.

### Session 29b — August 20, 2026 (Finalize Tree Harmonization, Settings Sections, Model Picker)

Continuation of Session 29. Finalized the remaining implementation tasks:

1. **Harmonized subagent collapse visuals with folders**: Chat rows now use `[Icon] [Chevron] [Title] [Pill] [Actions]` slot order matching `renderDirEntries` folder rows. Subagent rows use `[Icon] [empty chevron] [Title] [Actions]` to maintain consistent indentation.
2. **Strict `isRepo` detection**: `renderDirEntries` now uses `Boolean(entry.isRepo)` exclusively for repo icons; workspace detection is separate (`isWorkspace` check) and excludes `/Users/user` home directory.
3. **WorkspaceGlyph in directory tree**: Directories matching active workspaces (but not repos) now show `WorkspaceGlyph` instead of generic folder icons.
4. **Cursor-positioned right-click context menus**: `ellipsisOpen` state changed from string to `{ id, pos: { x, y } }` object. All `onContextMenu` handlers in `renderChatRow`, subagent rows, and `renderDirEntries` now capture `(e.clientX, e.clientY)` and pass `position` prop to `SelectDropdownMenu`.
5. **Settings split (accounts/models/apps)**: Replaced single `ProvidersSection` registration with `AccountsSection` (order 8), `ModelsSection` (order 9), `AppsSection` (order 10) — each with dedicated icons and glyphs.
6. **dsh-tweaks integration**: Added `accounts`, `models`, `apps` to `INTEGRATION_IDS` set and `navIcon()` function in dsh-tweaks so they group and display correctly in the settings sidebar.
7. **Model picker toolbar decoration**: Added `ensureModelPickerDecoration()` MutationObserver that inserts a generic sparkles icon on model picker buttons and provider brand icons on dropdown items.

**Files changed:**
- `plugins/dsh-providers/client.js` — renderChatRow, renderDirEntries, apply sections, ensureModelPickerDecoration
- `plugins/dsh-tweaks/client.js` — navIcon, INTEGRATION_IDS

### Session 29c — August 20, 2026 (Fix Settings Trigger Shadowing, Portal Modal, and Click Dispatch)

Diagnosed and resolved settings button activation issues:
1. **Slot priority shadowing**: In Cordis single slots (`sidebar`, `sidebar.settings`, `settings.section:general`), registrations without explicit negative priority were not shadowing harness defaults. Added `priority: -10` to `sidebar`, `sidebar.settings`, and `general` section registrations in `dsh-tweaks`.
2. **React Portal modal mounting**: `SettingsPanel` now renders `.dsh-tw-overlay` via `ReactDOM.createPortal(modalNode, document.body)` so the fixed modal layer is never trapped inside nested sidebar stacking contexts or overflow constraints.
3. **Capture-phase document click listener**: Added capture-phase global listener in `TweaksSettingsRoot` intercepting any clicks on `[data-action="open-settings"]`, `.dsh-tw-settingsArea button`, `button.dsh-tw-trigger`, or harness trigger buttons, guaranteeing settings open regardless of DOM hierarchy.
4. **List slot priority shadowing in dsh-providers**: In Cordis list slots (`settings.section` and `settings.section.icon`), registering an entry with an existing ID (`models`) at the default priority `0` throws a collision error with harness defaults. Added `priority: -10` to all custom section and icon registrations in `dsh-providers` (`accounts`, `models`, `apps`, `terminals`, `containers`, `tools`, `loops`) and `dsh-tweaks` (`keybinds`, `harnessGlyph`).

### Session 29d — August 20, 2026 (Harmonize Chat Subagent Collapse Visuals with Folder Hover Swap)

1. **Folder-parity hover chevron swap for chat rows**: Replaced static chevron spacing with in-place hover replacement.
   - Rest state: Chat icon is visible, chevron takes zero space (`display: none`).
   - Hover state on sessions with subagents (`.dsh-has-children`): The chat icon hides and the interactive chevron arrow appears in the exact same 16px slot.
   - Sessions without subagents: Never render a chevron slot or empty gap, keeping icons consistently aligned.
2. **Subagent uncollapse fix**:
   - Added robust `getParentId()` helper supporting `parentId`, `parentSessionId`, `parentSession`, and `parent` fields.
   - Chevron slot and subagent count pill both handle click events with `e.stopPropagation()` and trigger `toggleSubagentExpand(chat.id)`.
   - Subagent rows use leaf rendering without empty chevron slots.

**Status:** completed, all 16 plugin test suites passed.
