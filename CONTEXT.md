# CONTEXT — full session run-through

> Complete memory/context file, kept in-repo. Written 2026-08-14, updated 2026-08-15.
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

**Outcome:** [filled at round end]
