# CONTEXT — full session run-through

> Complete memory/context file, kept in-repo. Written 2026-08-14. Covers, in
> chronological order: (1) the **Andromeda port project** (biggest prior session,
> `ses_002adefbcffe`, 1375 msgs, Aug 13 → Aug 14 18:54), (2) the **Lidless/LSP/admin
> session** (`ses_00060d5deffe`), (3) the **opencode↔dsh parity + product-plan
> session** (`ses_0004c6e67f` — the most recent, chronologically after the others).
> Ends with a final memory context / state of the world. Backlog lives in
> `BACKLOG.md`.

---

## 0. Session map (chronological)

| # | Session | When | What |
|---|---|---|---|
| 1 | `ses_002adefbcffe` (big, 1375 msgs) | Aug 13 22:50 UTC → Aug 14 18:54 local | Andromeda → dsh port: pastacode pivot, plugins, P6, decommission |
| 2 | `ses_00060d5deffe` (22 msgs) | Aug 14 | Lidless install, opencode LSP enable, admin agent |
| 3 | `ses_0004c6e67f` (current, 39 msgs) | Aug 14 late (most recent) | opencode↔dsh parity map, 21-row delta, Tauri/Tailscale/PWA plan |

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

## 3. Session 3 — opencode↔dsh parity + product plan (current, most recent)

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

## 4. Final memory context (state of the world, 2026-08-14)

**Project:** `agents` = a plugin-built personal agent runtime on DeepSeek Harness.
GitHub: `marius-patrik/{agents,Andromeda,dsh-credentials,dsh-dialects,dsh-providers,
dsh-tweaks,dsh-subscriptions}` (all clean & pushed; `agents-oss` deleted). Local:
`~/agents` (superproject at `e234f43`, submodules on `main`), harness pinned
`47f943859b` (rc.5, detached, pristine), `~/.dsh` harness home.

**Done:** pastacode fork idea abandoned → dsh pivot; 5 plugins shipped + boot-verified;
P6 credentials v2 (full Andromeda vault parity) complete; Andromeda decommission
executed (commit `c6d8cda`); port-source kept (orchestrator, memory, state files);
opencode↔dsh parity map + 21-row delta table; Tailscale blockers verified; Tauri
viability validated; PWA chosen for mobile; stack agreed.

**Open threads:**
1. Product plan next steps (offered, awaiting go-ahead): (a) ready-to-drop
   `cordis.patch.yml` for Tailscale (both variants: `0.0.0.0` bind + trustedHosts, and
   `tailscale serve` alternative); (b) Tauri v2 sidecar sketch (spawn `dsh web`, WebView
   → 127.0.0.1:3080, Node/Bun bundling); (c) PWA manifest + responsive-pass notes for
   `dsh-web-frontend`.
2. Session-1 tail ("and .") may have had a third item — user confirmed only the two
   (PLAN.md update + agents-oss deletion) were done.
3. Future plugin candidates still in Andromeda: orchestrator (baton/heartbeat), memory
   (durable memory), remaining state files. Credentials v3 = full account/credential
   manager for ALL the user's accounts (phase 2, deferred).
4. Open questions: where dsh server runs long-term (Mac mini/NAS/VPS → tailnet naming);
   native auth on mobile (Face ID/OS keychain) vs pure PWA; does dsh `ui-*` respond well
   at phone widths; single-tenant vs multi-user (trustedHosts/approval implications).
5. Environment notes: macOS (`/Users/user`); opencode config at
   `~/.config/opencode/opencode.jsonc` (`"lsp": true`), admin agent at
   `~/.config/opencode/agents/admin.md`; Lidless installed (lid-closed operation);
   opencode session store at `~/.local/share/opencode/opencode.db` (SQLite); transcript
   dumps + dump script in `/var/folders/w_/bvxstwzj2s9cq2jm7lmw884c0000gn/T/opencode/`.

---

## 5. Relevant files
- `/Users/user/agents/PLAN.md` — the authoritative project plan (repos, mapping, P6,
  decommission, dependency policy, cadence)
- `/Users/user/agents/BACKLOG.md` — parity delta backlog w/ knocked-off status
- `/Users/user/agents/README.md`, `/Users/user/agents/scripts/{agents,bootstrap,dsh}`
- `/Users/user/agents/harness/` (pinned deepseek-harness), `/Users/user/agents/plugins/`
  (5 plugin submodules)
- `/Users/user/Andromeda/` — port-source (commit `c6d8cda`)
- `/Users/user/.config/opencode/opencode.jsonc`, `/Users/user/.config/opencode/agents/admin.md`
- `/Users/user/.local/share/opencode/opencode.db` — session store (transcripts source)
- `/Users/user/dsh-opencode-memory.md` — working copy of this file
