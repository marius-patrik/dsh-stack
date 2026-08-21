# BACKLOG — opencode parity delta (with shipped plugins knocked off)

> Written 2026-08-14 alongside `CONTEXT.md`; re-keyed by owning plugin 2026-08-15.
> Source: the opencode↔dsh parity analysis (session `ses_0004c6e67f`). This is the
> working backlog: every parity delta from the opencode comparison, with a status
> column and an **owner plugin** (from the P7+ roadmap in PLAN.md). Rows that overlap
> with **already-shipped plugins** or **native dsh features** are knocked off / marked
> partial. Items kept are the real remaining work toward "opencode parity".

---

## 1. How to read

- **DONE** — already covered by one of our shipped plugins or native dsh. Knock it off.
- **PARTIAL** — a piece is covered; the rest stays in backlog.
- **OPEN** — not covered anywhere; still real work.

Status key is per delta row. Then §3 lists *what we already shipped* so the overlap is
explicit and verifiable.

---

## 2. Parity map (condensed, from the analysis)

| Feature | opencode | dsh |
|---|---|---|
| Maturity | MIT, GA | MIT, dev preview (breaking changes) |
| Surfaces | TUI, desktop, IDE ext, web | Web UI (default), headless, ACP; TUI opt-in |
| Providers | 75+ via Models.dev, Zen, Go, Copilot/ChatGPT | DeepSeek native + catalog + custom endpoints |
| Multi-session / parallel | Yes | Yes (fork/resume) |
| Plan/Build toggle | Yes (Tab) | `/plan` only; no first-class toggle |
| Undo/redo | `/undo` `/redo` | Via session log fork only |
| LSP | Auto-load | `lsp-stdio` manual config |
| Shell | bash | bash/pwsh + persistent terminals |
| Code runtime | — | worker-thread w/ budgets |
| Background jobs | — | Yes |
| Subagents / skills / MCP / ACP | Yes | Yes |
| Hooks | Commands/hooks | Claude Code + Codex hooks compatible |
| Sandbox / approval | Permissions/policies | Sandbox policy + approval + E2B + Windows ACL |
| Session persistence | Local + share links | Append-only log + replay (stronger) |
| Headless one-shot | `opencode run` | `dsh --profile headless "job"` |
| HTTP server / API | `opencode serve` (OpenAPI) | Web server + `/api` gateway (loopback trust fence) |
| SDK | `@opencode-ai/sdk` (TS) | Python SDK + Cordis/TS host |
| Git | GitHub, GitLab | none documented |
| Install | 10+ pkg managers, docker, binaries | `npx` or source |

opencode-only: desktop app, IDE ext, share links, GitLab, Copilot/ChatGPT logins,
themes/keybinds/commands/formatters, `/init`, `/undo` `/redo`, Zen, Go, stats CLI.
dsh-only: persistent terminal, code runtime, background jobs, persisted goals,
CC/Codex hooks compat, E2B sandbox, session replay, everything-as-config-plugin.

---

## 3. Shipped Monorepo Plugins & 6 Domain Packs (All Knocked Off)

All 6 Domain Packs & 56 Atomic Plugins are shipped and validated across 80 green test suites:

| Domain Pack | Sub-Packages | Status |
|---|---|---|
| **`core/`** (`@stack/pack-core`) | `plugin-manager`, `providers-registry`, `integrations-registry`, `vault-credentials`, `sidebar-tree`, `settings-dialog`, `keybindings` | **DONE** (shipped + verified) |
| **`ux/`** (`@stack/pack-ux`) | `tab-manager`, `code-editor`, `icon-engine` (`packs/lucide-animated`), `theme-studio`, `voice-synthesis`, `terminal-client` | **DONE** (shipped + verified) |
| **`agents/`** (`@stack/pack-agents`) | `personas`, `actions`, `commands`, `tools`, `loops`, `skills`, `translator` | **DONE** (shipped + verified) |
| **`ai/`** (`@stack/pack-ai`) | `protocol-dialects` | **DONE** (shipped + verified) |
| **`integrations/`** (`@stack/pack-integrations`) | `tmux-terminal` (16 CLI harnesses: `claude`, `kimi`, `antigravity`, `codex`, `cursor`, `grok`, `hermes`, `ollama`, `github-cli`, `git-cli`, `sapling-cli`, `code-cli`, `bun-cli`, `pnpm-cli`, `npm-cli`, `nvm-cli`), `package-managers`, `code-server`, `providers` (4 direct APIs), `docker-sandbox`, `lsp-client` (5 language servers), `code-formatters`, `mesh-hosts` | **DONE** (shipped + verified) |
| **`vcs/`** (`@stack/pack-vcs`) | `workbench-core`, `git-driver`, `sapling-driver`, `github-forge`, `gitlab-forge`, `forgejo-forge` | **DONE** (shipped + verified) |

---

## 4. Legacy Plugin Equivalents

| `dsh-dialects` | shipped + boot-verified | Provider **wire dialects**: openai, claude, gemini, code-assist |
| `dsh-providers` | shipped + boot-verified | **Provider adapters** for subscription + API providers; `PROVIDER_ROUTES` descriptor registry |
| `dsh-tweaks` | shipped + boot-verified | **State folder** (homeRoot) + **command string config**; provider **filter** (subscriptions vs API split, pinning/favorites) |
| `dsh-subscriptions` | shipped + boot-verified | **Single-seat subscription remap** — use existing LLM subscription accounts as providers |
| `dsh-credentials` | v2 shipped + boot-verified | Full **account/credential manager** (vault parity): password/otp/passkey/oauth tokens, login flows, agent-usable, scoped access, audit |

Native dsh already provides (do NOT re-plan): multi-session/fork/resume, LSP
(`lsp-stdio`), shell + persistent terminals, code runtime, background jobs, subagents,
skills, MCP, ACP, hooks (CC + Codex), sandbox/approval, headless one-shot, HTTP server
+ `/api`, session persistence + replay, context compaction, everything-as-plugin.

---

## 4. Delta backlog — dsh → opencode parity (21 rows)

Dropped by user instruction (not backlog): IDE extension, install matrix, subscription
OAuth logins (Copilot/ChatGPT), Enterprise docs.

| # | Area | Delta (missing in dsh) | Effort | Status | Owner | Note |
|---|---|---|---|---|---|---|
| 1 | Interfaces | Desktop app (macOS/Win/Linux) | XL | DONE | `dsh-desktop` (P3) | Tauri v2 shell + lifecycle plugin: readiness route, boot URL, spawn helpers |
| 2 | Interfaces | Terminal TUI as shipped default profile | L | OPEN | `dsh-tui` (P1 scaffold) | deferred by decision: web profile is the shipped default; TUI stays a thin client-only scaffold until a keyboard-first experience is wanted |
| 3 | Models | Curated model gateway | XL | OPEN | product | Zen-analog; product decision, not plugin |
| 4 | Models | Low-cost subscription to tested open models | XL | PARTIAL | `dsh-subscriptions` | single-seat remap shipped; hosted gateway open |
| 5 | Models | Broad provider catalog (75+ via Models.dev) | L | DONE | `dsh-providers` (P7) | 13 routes: 5 subscription adapters + 8 API-key routes (openai/anthropic/gemini/grok/deepseek/mistral/groq/openrouter); `subscription-only` default hides API routes, `mode: "all"` offers them |
| 6 | Collaboration | Public session share links | M | DONE | `dsh-tweaks` (P2) | self-hosted `/share/:id`, readonly default, token-gated interactive |
| 7 | Git | GitHub integration (PR/commit workflows) | L | DONE | `dsh-credentials` + `dsh-repos` (P6) | GitHub OAuth account in vault (P6a) + branch/commit/push/PR (P6b); GitLab split out as row 8 |
| 8 | Git | GitLab integration | S | OPEN | `dsh-repos` (later) | planned, same shape as shipped GitHub half: `GITLAB_TOKEN` slot + importer in `dsh-credentials`, MR + merge repo tools over subprocess/REST. **⚠ GATE: awaiting user input on scope — full parity vs read-only vs defer (see CONTEXT.md Session 14)** |
| 9 | Git | Repo-analysis agentic init → `AGENTS.md` | M | OPEN | `dsh-repos` (later) | planned: `dsh repos init` reads repo state, writes a harness-flavored AGENTS.md; additive tool, no new seams. **⚠ GATE: awaiting user input on scope — what should it generate? (see CONTEXT.md Session 14)** |
| 10 | Session UX | `/undo` `/redo` | S | DONE | `dsh-tweaks` (P2) | fork-based via `sessions.create(seed)` |
| 11 | Session UX | First-class Plan/Build toggle | S | DONE | `dsh-tweaks` (P2) | `/build` delegates `planMode.set`; harness `/plan` complements; session-modes will add explicit tool/search/action/agent/shell/code modes |
| 12 | Session UX | Drag-and-drop images into prompt | S | PARTIAL | `dsh-tweaks` (P2) | attachment seam composed via profile; maxImageBytes knob |
| 13 | Session UX | Custom slash commands | M | DONE | `dsh-tweaks` (P2) | settings `commands` section -> registry bridge |
| 14 | Session UX | Keybind customization | S | DONE | `dsh-tweaks` (P2) | `keybinds` settings surface + validators |
| 15 | Session UX | Themes | S | DONE | `dsh-themes` (P4) | VS Code/TextMate; file install + Open VSX catalog |
| 16 | Session UX | Code formatters (auto-format on edit) | M | DONE | `dsh-formatters` (P5) | formatter table + `format` tool + `tools/post-execute` auto-format; also `dsh-lsp` server table for the LSP seam |
| 17 | Agent config | Custom agents as JSON/Markdown files | M | DONE | `dsh-agents` (P6) | persona files (MD/JSON) materialized as agent presets (base composition spliced, picker metadata, live roster) |
| 18 | Agent config | Config-file custom tools | M | DONE | `dsh-tools` (P6) | settings tool map registered via the harness tool seam; `{name}` placeholders |
| 19 | Observability | Token/cost stats CLI | S | DONE | `dsh-tweaks` (P2) | `dsh stats` reads session_projcache |
| 20 | Observability | Session list CLI | S | DONE | `dsh-tweaks` (P2) | `dsh sessions` JSON list |
| 21 | Maturity | GA stability guarantee + migration story | L | OPEN | — | dev preview; breaking changes expected |
| 22 | Provider UX | Provider quota and usage visibility below Models | L | OPEN | `dsh-quotas` | provider-neutral snapshots; reverse-engineered endpoints only where stable; CLI/subscription adapters planned separately; read-only, cached, freshness/reset aware; scaffolded + live `/quotas/api/snapshots` 200; Phase B shipped: settings section at order 15 + `IconDataOutline16` nav glyph; meter-bar data polish in Phase 11 F. Dashboard shipped (HTML UI, summary API, per-provider refresh, meter bars). **⚠ GATE: awaiting user input on further polish scope (see CONTEXT.md Session 14)** |
| 23 | Session UX | Explicit tool/search/action/plan/agent/shell/code modes | L | IN PROGRESS | `dsh-session-modes` | durable mode event + pending acceptance, executor-level allowlists, request routing, isolated preset row, bounded subagent assist; Phase B shipped: `/session-modes` route + Session Modes settings tab (order 20, `IconListPenOutline16`) showing the mode vocabulary, default, and per-mode route/tool policies |
| 24 | Credential UX | Keychain settings tab with full typed credential records and provider bindings | L | IN PROGRESS | `dsh-credentials` + abstraction layer | move credential inputs out of provider cards, expose typed material/account/purpose metadata, and give each provider a Keychain redirect; Phase B shipped: Keychain settings section at order 35 + `IconApiOutline14` nav glyph; full typed records + Models binding delivered in Phase 11 D via the `settings.models.row` seat + `openSection` (`BLOCKED.md` #1). **⚠ GATE: awaiting user input on how "Manage in Keychain" should work — deep-link vs popover vs inline toggle (see CONTEXT.md Session 14)** |
| 25 | Platform | Harness extension layer (Option A): tweaks-owned UI occupants + seams for every settings/credential/agent/sidebar feature | L | SHIPPED | `dsh-tweaks` | Phase A shipped + boot-verified: `dsh.client` manifest, take-over bundle (sidebar/settings occupants, chrome, `sidebar.newSession`/`sidebar.history`/`settings.section.icon`), profile disable rows for `ui-sidebar`/`ui-settings-general`. Phase B shipped + boot-verified: settings nav reorder (General 0 → Models 10 → Quotas 15 → Session Modes 20 → Agents 25 → Themes 30 → Keychain 35 → Plugins 40), every row's glyph via the `settings.section.icon` seat (owning plugins register theirs; dsh-tweaks owns the three harness-section glyphs + fallback map), and full Session Modes / Agents / Themes tabs in the owning plugins' bundles; all six client rows in the boot manifest. Phase C shipped (tsc clean + check-plugin green): live personas — `persona/selected` durable log event, `PersonaController` (queued/committed/cancelled/noop, open-turn deferral), `persona:policy` prompt section (order 45, live → header → default → '' resolution), `persona` projection unit, `/persona` command, neutral composition row (`text: ''`), client badge (`PersonaChip` in `conversation.input.left`, `useProjection('persona')`, roster-backed `nameFor`) + `/persona` popupSelect switcher (`commandUi.register`, `remote.commands.execute`); client inject grows to `['slots','connection','commandUi','sessions','remote']`; `catalog.ts` extensionOf bug fixed (`'md'` → `'.md'`). Phase D shipped: Keychain↔Models binding via `settings.models.row` seat + `openSection` + `/vault?ref=` deep-link. Phase E shipped: sidebar history section (SidebarHistory component, last 15 sessions, relative time, click-to-switch), machine-root via workspace labels, chevrons/drag already in ui-workspace. Phase F shipped: quotas auto-refresh (60s timer), activity log, per-session usage tracking. Product scope in PRD.md, seam audit in BLOCKED.md. |

**Net remaining work (OPEN, by area + owner):**
- `dsh-tui` (P1 scaffold, impl later): TUI default (2)
- product: curated gateway (3)
- `dsh-subscriptions`: hosted gateway product (4-remainder)
- `dsh-tweaks` (P2): share links (6), undo/redo (10), Plan/Build (11), drag-drop (12),
  slash commands (13), keybinds (14), stats CLI (19), session list CLI (20)
- `dsh-repos` (later): GitLab (8), agentic init (9)
- —: GA (21)
- `dsh-quotas`: provider quota/usage dashboard (22)
- `dsh-session-modes`: explicit mode kernel and agent assist (23)
- `dsh-credentials` + abstraction layer: Keychain/provider binding (24)
- `dsh-tweaks`: harness extension layer (25)

Phase order (from PLAN.md): P1 scaffold → P2 tweaks v2 (share/observability/session-UX,
the densest round) → P3 desktop → P4 themes → P5 formatters → P6 partials → P7 provider
breadth → P8 session modes → P9 quotas → P10 Keychain → **P11 harness extension layer
(Option A) — the abstraction that delivers the P8/P10 UI surfaces without harness
edits** (PRD.md + BLOCKED.md). Session-UX S-items (10, 11, 14) are the cheapest first
slices within P2.

---

## 5. Fork-era asks now moot or superseded

From the abandoned pastacode (opencode fork) plan — check before treating as backlog:
- **tmux integration / pink status bar / `opencode attach`** — superseded by the dsh
  pivot (server-based sessions + web UI). Moot.
- **Directory sandboxing (`/directory`, root/local/user)** — covered natively by dsh
  sandbox policy + workspace-write modes. Moot as a fork feature; re-visit only if the
  sandbox UX falls short.
- **State folder `.agents` + command config** — shipped in `dsh-tweaks`. Done.
- **Provider list split (Subscriptions vs API) + favoriting** — shipped in `dsh-tweaks`
  (filter/pinning). Done.
- **Subscription support (Gemini/Claude/Groq/Cursor/Kimi)** — shipped in
  `dsh-subscriptions` + `dsh-providers` + `dsh-credentials`. Done.
- **Credentials manager for ALL accounts (v2+, phase 2)** — `dsh-credentials` v2
  shipped (vault parity); v3 = full general account manager is deferred phase 2.
  Backlog (future).
- **Reverse-engineering subscription auth** — Andromeda importers landed as
  `CLAUDE_SUB_OAUTH_TOKEN`, `GROK_SUB_OAUTH_TOKEN`, `GEMINI_SUB_OAUTH_TOKEN`
  (Code Assist OAuth bearer; the old `GEMINI_SUB_COOKIE_*` slots were dropped
  with the consumer-web transport), `KIMI_SUB_OAUTH_TOKEN`, `KIMI_API_KEY`;
  `CURSOR_SUB_TOKEN` removed with `cursor-sub`. Done.
- **Subscription token refresh** — every subscription OAuth token now refreshes
  on expiry and persists its rotated bundle: `dsh-providers` keeps
  `*_REFRESH_TOKEN` + `*_EXPIRES` refs in the account vault with singleflight +
  write-back, and the privatecode plugin refreshes + rewrites its `auth.json`
  `{type:"oauth"}` entries. kimi/grok/claude refresh tokens are single-use;
  gemini's is durable. Live-verified for kimi + gemini in both stacks. Done.

Deferred plugin candidates (port-source kept in Andromeda): `src/cli/orchestrator.ts`
(baton/heartbeat), `src/cli/memory.ts` (durable memory), remaining `src/cli/state*.ts`.

---

## 6. Session 16 buildout rows (2026-08-17)

Source: `.agents/requests/session-16-providers-overhaul-loops-zen.md`. These rows
supersede the Session-14 gates (Keychain deep-link question, quotas polish, sidebar
batch scope): the user gave explicit directives.

| # | Area | Delta | Effort | Status | Owner | Note |
|---|---|---|---|---|---|---|
| 26 | Themes UI | VS Code theme catalog (Open VSX search/install) inside the Themes settings tab | M | OPEN | `dsh-themes` | node half (catalog/route/CLI) shipped P4; only the settings tab UI is missing — tab is switcher-only today |
| 27 | Credential UX | Keychain overhaul: correct nav icon, full settings section (not an embedded modal page), typed-record CRUD (list/add/edit/remove/reveal) | L | OPEN | `dsh-credentials` | supersedes row 24 gate; deep-link + Models binding still apply |
| 28 | Agent config | Split agent presets across Agents and Actions tabs; both tabs inadequate → full rosters | L | OPEN | `dsh-agents` + `dsh-actions` | harness "Agent" section renamed "Agents"; personas + agent presets live there; action/mode presets live in Actions |
| 29 | Platform | Rename dsh-session-modes → dsh-actions: package, repo, profile, client, routes, docs | M | OPEN | `dsh-actions` | GitHub repo rename + superproject submodule path + web profile wiring |
| 30 | Provider UX | Merge Quotas + Models settings tabs into "Providers"; per-provider auth + subscription + quota indicators | L | OPEN | `dsh-providers` + `dsh-tweaks` | Models section is harness-owned (ui-settings-models) → replaced via tweaks occupant, same pattern as settings.general |
| 31 | Platform | Merge dsh-subscriptions + dsh-quotas plugins into dsh-providers (single providers plugin) | L | SHIPPED | `dsh-providers` | **P12.1 complete**: remap.ts merged, quotas subpackage (QuotaRegistry, web routes, auto-refresh, settings) wired into apply(), two repos deleted, .gitmodules cleaned. zen route added (24 models). check-plugin passes. |
| 32 | Tools UX | dsh-tools exposed in settings: full user control (list/enable/disable/add/edit/remove custom tools) | M | OPEN | `dsh-tools` | settings section + web routes over the existing tools registry |
| 33 | Loops | New plugin dsh-loops: goal-based loops from .agents/loops; predefinable criteria + workflows incl. deterministic orchestration; editable via agent tools and settings | XL | OPEN | `dsh-loops` | new repo; settings section + agent tools (loop create/edit/run/stop) |
| 34 | Platform | Plugin enable/disable in settings via dsh-tweaks, with "takes effect on reload" popup + reload button | M | OPEN | `dsh-tweaks` | writes profile enable state; popup + `location.reload()` affordance |
| 35 | Agent config | Actions live under .agents/actions (file-based action definitions, like persona files) | M | OPEN | `dsh-actions` | mirrors dsh-agents catalog/sync pattern |
| 36 | Models | OpenCode Zen provider: auth + quotas + catalog, in dsh-providers | L | SHIPPED | `dsh-providers` | zen route in PROVIDER_ROUTES: opencode.ai/zen/v1, openai dialect, ZEN_API_KEY slot, 24-model catalog (GPT 5.x, Claude, Gemini, Grok, DeepSeek, Kimi, Qwen, free tier). quota probe via GET /zen/v1/models. check-plugin passes. |
| 37 | Models | OpenCode **Go** provider with full parity to other providers: login flow, token refresh, quota probe, catalog | L | OPEN | `dsh-providers` | same shape as Zen (row 36); wire-truth first against opencode.ai/go endpoints |
| 38 | Session UX | Actions **run palette** in the session input bar + **reload app** command (clean reload that preserves running agents and resumes them after) + **force reload** (server self-restart: spawn replacement, then exit) | L | OPEN | `dsh-actions` + `dsh-tweaks` | force reload must NOT kill the caller mid-call — self-spawn pattern; clean reload resumes agents post-restart |
| 39 | Platform | Harness accessible via Tailscale | S/M | OPEN | `dsh-tweaks` | if more than a bind config change (likely: loopback trust fence / auth on non-loopback), implement via dsh-tweaks |
| 40 | Voice | Own dsh-voice plugin (MIT zhuiyueya/dsh-voice as reference base): browser STT + human-sounding model-assisted TTS through vault credentials | L | OPEN | `dsh-voice` | third-party dsh-voice uninstalled from profile; ours must sound human (model TTS), not classic TTS |
| 47 | Reliability | Mid-use auth failures (kimi ~15-min TTL token dies mid-session, mass agent deaths 2026-08-17/18 ×2) | M | FIXED (soak pending) | `dsh-providers` + `dsh-credentials` | root causes: refresh-token-last write order (death spiral on process kill mid-rotation), ISO-vs-epoch expiry mismatch (login flows wrote ISO, refresh gate expects epoch ms), transient failures unretried, invalid_grant silently returning stale token forever. Fixed in dsh-providers 0c2999d (refresh-first write order, ISO parse, 1 retry, permanent→missing-credential) + dsh-credentials 6b431b5 (epoch-ms expiry refs) |

---

## 8. Settings IA corrections (2026-08-18, user)

Supersede parts of rows 24/27/28/30 and the P11 nav order where conflicting:

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 48 | **General loses Appearance** — appearance lives ONLY in the Themes tab, which offers VS Code themes with a dark and light default pair | OPEN | `dsh-themes` + `dsh-tweaks` | tweaks-owned settings root removes the harness appearance subsection; dsh-themes ships default light+dark VS Code themes + the picker |
| 49 | **Merge Session Modes + Agents + agent presets into one "Agents" tab** | OPEN | `dsh-agents` (+ dsh-actions content) | supersedes the "Session Modes → Actions tab" split direction for the UI: one Agents tab contains agent presets, personas, and action/mode presets; dsh-actions plugin code rename still proceeds (profile package is dsh-actions) but its settings surface folds into the Agents tab; P13 row 43 (actions→tweaks) still stands |
| 50 | **Rename Models → Providers and merge Keychain INTO it** — no separate Keychain tab; credential management lives per-provider inside Providers | OPEN | `dsh-providers` + `dsh-credentials` (client) + `dsh-tweaks` (nav) | Claude is live in providers/credentials — do not start until it settles. "Quota data isn't showing" noted; Claude's status-light/probe commits address it — verify after |

---

## 7. P13 consolidation directives (2026-08-18, user) — resolve after big-pickle settles

End-state repo map (everything else gets archived with deprecation notices):

| # | Directive | Target repo | Absorbed (archived) |
|---|---|---|---|
| 41 | Merge quotas + subscriptions + dialects + providers + **credentials** + translator into ONE providers plugin | `dsh-providers` | ~~dsh-quotas~~ ✅, ~~dsh-subscriptions~~ ✅, dsh-dialects, dsh-credentials, dsh-translator |
| 42 | Web UI only supports VS Code themes: implement default themes + catalogue, port the theming UI fully | `dsh-themes` | harness ui-theme occupant (replaced via tweaks seat) |
| 43 | Merge actions + **agents** into tweaks | `dsh-tweaks` | dsh-actions, dsh-agents |
| 44 | Merge formatters + lsp + repos into a new `dsh-code` plugin | `dsh-code` (new) | dsh-formatters, dsh-lsp, dsh-repos |
| 45 | Own TUI fully integrated with dsh (drop the opencode-fork plan); find a base to fork | `dsh-tui` | privatecode as TUI base |
| 46 | Merge tools + loops into tweaks | `dsh-tweaks` | dsh-tools, dsh-loops |


## 9. Amendments 2-5 (2026-08-18, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 51 | **Codex (ChatGPT-sub) provider** — full parity: login (device/CLI), model list, probes, quotas, refresh, reasoning-effort levels | OPEN | `dsh-integrations` | wire-truth first (auth.openai.com / chatgpt.com backend); reference opencode's chatgpt login |
| 52 | Provider display names + per-row **(Sub)/(API)** badge: Kimi Code/Kimi Console, Claude Code/Anthropic Console, DeepSeek Console, Antigravity/Google Cloud, Grok Build / **xAI API**, OpenCode Zen/Go | OPEN | `dsh-integrations` | lands with the Integrations tab |
| 53 | Settings tab: Models + Keychain + Quotas → one **Integrations** tab | OPEN | `dsh-integrations` + `dsh-tweaks` | supersedes row 50 naming ("Providers") |
| 54 | dsh-themes + dsh-voice fold into dsh-tweaks; **dsh-desktop DELETED** | IN PROGRESS | `dsh-tweaks` | final plugin count: integrations, tweaks, code, tui |
| 55 | Data import | Import EVERYTHING from the drive into dsh — sessions (all tools), skills, hooks, memory — plus SSH to desktop machine for its state. Prior translator import left many sessions not loading + missing | XL | OPEN | `dsh-translator` → `dsh-integrations` | audit existing ~/.agents/sessions imports first (which fail to load and why), then full-disk discovery (claude, opencode, gemini, codex, cursor, andromeda, ...), then desktop SSH pull |
| 56 | Providers | **Cursor subscription provider** — re-implement with full parity (was dropped as unreachable Connect-RPC; retry with fresh wire-truth) | L | OPEN | `dsh-integrations` | login + refresh + models + quotas + probes |
| 57 | Providers | **Antigravity model picking** — user rejects "server-determined" conclusion: the Antigravity CLI has a picker, so the client must signal the model; find the mechanism (config id derivation, request field); FALLBACK: use the CLI fake-PTY wrapper (as used for login) as the transport for chat + model selection | L | OPEN | `dsh-integrations` | supersedes Claude commit 6db23b1 conclusion |


## 10. Session 20 UI Polish (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 58 | **Input bar plus button**: Center vertically in `.inputRow` and size to 34px circle matching the send button | DONE ✅ | `harness` + `dsh-tweaks` | Matches 34px send button size and vertically centers in input card |
| 59 | **Message placeholder/preview text**: Vertically center "Message the agent" text in composer | DONE ✅ | `harness` + `dsh-tweaks` | Fix uneven padding / row alignment |
| 60 | **Panel plus button context menu**: Add unified menu (New Chat, New Terminal, New Container) | DONE ✅ | `dsh-providers` | Dropdown menu on panel plus button matching sidebar |
| 61 | **Collapsed sidebar plus button**: Remove new workspace button; show unified plus button | DONE ✅ | `dsh-providers` + `harness` | Clean collapsed rail with unified plus button |
| 62 | **Unified panel tabs (full UI)**: Make Conversation a first-class panel tab alongside Terminals and Containers | DONE ✅ | `dsh-providers` | Full UI multi-tab management (Conversation, Terminals, Sandboxes) |
| 63 | **Remove header preset badge**: Remove preset badge from session header | DONE ✅ | `harness` | Preset selector lives in input bar toolbar |
| 64 | **Session log download 3-dots menu**: Hide download button under three-dots context menu | DONE ✅ | `harness` | Streamlined session header utilities |
| 65 | **Goal badge OLED styling**: True OLED dark background and borders for goal bar | DONE ✅ | `dsh-themes` | `#000000`/`#050505` background and `#1a1a1a` border in OLED mode |

## 11. Session 22 Settings Shell, Mobile Layout, Drag-and-Drop Tabs & Context Menus (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 66 | **Settings sidebar collapsible & resizable**: Resizable nav rail (drag width) and collapse toggle | DONE ✅ | `dsh-tweaks` | Adjustable settings sidebar width with collapse to rail |
| 67 | **Main sidebar mobile full width**: Expand to full viewport width on screens <= 768px | DONE ✅ | `dsh-tweaks` | Mobile responsive full-screen drawer |
| 68 | **Draggable settings modal**: Drag settings window across viewport via header | DONE ✅ | `dsh-tweaks` | Header drag handle with mouse coordinates tracking |
| 69 | **Context menu Cut/Copy/Paste/Close/Rename**: Rich clipboard + contextual close/rename for items | DONE ✅ | `dsh-tweaks` | Full context menu options matching modern desktop UX |
| 70 | **Panel plus menu z-index fix**: Elevate dropdown z-index above terminal/webview | DONE ✅ | `dsh-providers` | High z-index (10000000) & fixed anchor pos for clean dropdown overlay |
| 71 | **Top conversation tab bar & Drag-and-Drop**: Top tab bar with plus button & cross-panel tab drag | DONE ✅ | `dsh-providers` + `dsh-tweaks` | Drag tabs between main conversation top bar and bottom panel |

## 12. Session 23 Sidebar Polish, Menus, Centering, Main Tabs & Settings Fix (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 72 | **Sidebar chat right click + hover 3-dots**: Context menu with Rename/Archive and hover 3-dots button | DONE ✅ | `dsh-providers` + `dsh-tweaks` | Chat row hover 3-dots & right click menu with rename/archive |
| 73 | **Sidebar visual consistency**: Clean & unify font sizes (12px), row heights (30px), and indentation steps | DONE ✅ | `dsh-providers` | Unified typography and layout hierarchy |
| 74 | **Folder hover 3-dots menu**: Replace terminal button with 3-dots button next to plus containing folder actions | DONE ✅ | `dsh-providers` | Focus, terminal, cut, copy path, rename, delete, new chat in 3-dots menu |
| 75 | **Input bar plus button & draft centering**: Strict vertical centering of plus button and input placeholder | DONE ✅ | `harness` + `dsh-tweaks` | Flex alignment and line-height centering |
| 76 | **Main view plus opens in main view**: Open terminal/container directly in top area when launched from top plus | DONE ✅ | `dsh-providers` | Standalone main view terminal / container rendering |
| 77 | **Remove top preset badge**: Fully purge any top session header preset badge | DONE ✅ | `harness` + `dsh-agents` | Badge only shown in input bar toolbar |
| 78 | **Provider icons in settings**: Brand SVGs for all provider rows in Settings | DONE ✅ | `dsh-providers` | OpenAI, Anthropic, Gemini, Grok, Kimi, DeepSeek, Zen, Ollama icons |
| 79 | **Settings button fix**: Fix settings button not opening or disappearing on click | DONE ✅ | `dsh-tweaks` | Fix settings trigger and open state lifecycle |
| 80 | **Cross-panel tab deduplication & mutual exclusivity**: Tabs moved between top and bottom are removed from source | DONE ✅ | `dsh-providers` | Single unified mutually exclusive tab state |

## 13. Session 24 Header Menus, Tab Unification & Panel Collapse (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 81 | **Download session log in 3-dots context menu**: Hide export button under three-dots menu | DONE ✅ | `harness` + `dsh-tweaks` | Clean session header utility menu |
| 82 | **Ungrouped chats collapsed by default**: Default `isUngroupedOpen` to `false` in sidebar explorer | DONE ✅ | `dsh-providers` | Start with ungrouped conversations section collapsed |
| 83 | **Unify panel tabs with top styling**: Align bottom panel tab strip with top capsule/pill tabs | DONE ✅ | `dsh-providers` | Shared visual design for all tabs |
| 84 | **Panel collapse toggle & remove close button**: Replace maximize with collapse button, remove close | DONE ✅ | `dsh-providers` | Clean panel minimize/expand toggle |
| 85 | **Terminal specialized actions in 3-dots & right-click**: Refresh buffer & session ops in context/3-dots menus | DONE ✅ | `dsh-providers` | Right-click tab context menu and tab bar trailing three-dots menu |

## 14. Session 25 Sidebar Search, Input Text Centering, Delete Skills, Settings Fix & Panel Alignment (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 86 | **Sidebar search input & visibility setting**: Search box at top of sidebar with toggle in Settings | DONE ✅ | `dsh-providers` + `dsh-tweaks` | Quick filter of files and chats, with hide/show setting |
| 87 | **Input bar preview text true vertical centering**: Center text glyphs vertically (fix bottom on centerline) | DONE ✅ | `dsh-tweaks` | Exact line-height and padding flex centering |
| 88 | **Delete all Cursor imported skills**: Remove cursor imported skills | DONE ✅ | `dsh-stack` | Purge cursor skills from project |
| 89 | **Settings button click fix**: Reliable open/trigger of settings dialog from sidebar and all buttons | DONE ✅ | `dsh-tweaks` | Fix click propagation and dialog state mount |
| 90 | **Remove duplicate conversation tab from panel**: Only show terminal/containers in panel when chat is in main | DONE ✅ | `dsh-providers` | Prevent duplicate conversation tab |
| 91 | **Panel background & edge alignment**: Fix gap behind panel and align edges with sidebar and centerCol | DONE ✅ | `dsh-providers` | Seamless docking and alignment |

## 15. Session 26 Conversation Content Move with Tab & Auto-Expand Collapsed Panel (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 92 | **Conversation content moves with tab**: Render conversation view in bottom panel when tab is moved/active in bottom | DONE ✅ | `dsh-providers` | Allow full-height conversation view in bottom panel without 38px restriction |
| 93 | **Auto-expand collapsed panel on tab click**: Clicking any tab in collapsed panel expands it | DONE ✅ | `dsh-providers` | Expand panel on tab click when isCollapsed is true |

## 16. Session 27 Tab Destinations, Right Sidebar, OLED, Terminal Unification & Panel Icon (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 94 | **Tab context move destinations**: Move to Main Area, Bottom Panel, Left/Right Sidebar | DONE ✅ | `dsh-providers` | Move actions in right-click and 3-dots menus |
| 95 | **Collapsible Right Sidebar dock**: Add right sidebar that can host tabs | DONE ✅ | `dsh-providers` | Resizable/collapsible dock on right |
| 96 | **Panel OLED black styling**: Respect pure OLED black in tab bar headers and containers | DONE ✅ | `dsh-providers` + `dsh-tweaks` | Pure #000000 / oled background variables |
| 97 | **Main view terminal unification**: Unify main view terminal with bottom terminal component (no fake input) | DONE ✅ | `dsh-providers` | Interactive tmux session component in main area |
| 98 | **Full conversation DOM/content hosting**: Move real conversation content when tab is moved | DONE ✅ | `dsh-providers` | Reparent/host conversation in active area |
| 99 | **Tab move empty fallback & sequence**: Switch to next tab or empty launcher card when tab moves | DONE ✅ | `dsh-providers` | Clean fallback state when tabs move |
| 100 | **Settings button click fix & Panel Icon**: Reliable settings trigger & panel dock icon (replace chevrons) | DONE ✅ | `dsh-tweaks` + `dsh-providers` | Panel dock icon and bulletproof settings launcher |

## 17. Session 28 Repo Icons, Sidebar Alignment, Pinned & Active Section, Purge Legacy Layouts (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 101 | **Repo icon detection in sidebar**: Render git repository icon for folders that are git repos | DONE ✅ | `dsh-providers` | Check .git / repo status and render repo glyph |
| 102 | **Sidebar item indentation alignment**: Child items below a folder line up with sibling subfolders | DONE ✅ | `dsh-providers` | Standardize tree row padding and icon/label gutters |
| 103 | **Rename section to "Pinned & Active"**: Rename "Live Sessions" section header to "Pinned & Active" | DONE ✅ | `dsh-providers` | Clean section title update |
| 104 | **Purge legacy sidebar layout**: Permanently remove old sidebar views so clicking terminal never regresses | DONE ✅ | `dsh-providers` | Remove legacy sidebar mode switches and dead views |

## 18. Session 29 Full UI Polish, Settings Split, Secondary Sidebar & Context Menus (2026-08-20, user)

| # | Directive | Status | Owner | Note |
|---|---|---|---|---|
| 105 | **Fix Settings Button**: Guarantee settings dialog opens from sidebar footer across all states | IN PROGRESS | `dsh-tweaks` | Fix double-toggle event conflict and set z-index to 1000000 |
| 106 | **Fix Git Repo Detection & Icon**: Strictly verify .git presence for repo icons, not home root | IN PROGRESS | `dsh-providers` | Accurate repo detection on backend and frontend |
| 107 | **Fix Sidebar Terminals/Containers Click Action**: Open and focus terminal/container in bottom panel | IN PROGRESS | `dsh-providers` | Reactive window listeners in BottomTerminalPanel |
| 108 | **Toolbar Model Picker Icon & Menu**: Generic model icon on toolbar button, provider brand icons in dropdown | IN PROGRESS | `dsh-providers` | SparklesGlyph on button, ProviderBrandIcon in list |
| 109 | **Unclosable Conversation Tab**: Prevent closing the main conversation tab (no close button) | IN PROGRESS | `dsh-providers` | Omit close button for chat tabs |
| 110 | **Split Settings into Accounts, Models, and Apps**: Dedicated sections with brand icons | IN PROGRESS | `dsh-providers` + `dsh-tweaks` | Accounts (8), Models (9), Apps (10) |
| 111 | **Harmonize Subagent Collapse Style**: Sessions with subagents match folder collapse visuals | IN PROGRESS | `dsh-providers` | Standardized slot order and chevron style |
| 112 | **Right-Click Context Menu Parity**: Right-click opens at cursor position with full 3-dots actions | IN PROGRESS | `dsh-providers` | Cursor-anchored SelectDropdownMenu |
| 113 | **Secondary Sidebar & Sidebar Swap Setting**: Add sidebar swap toggle in Personalization | IN PROGRESS | `dsh-tweaks` + `dsh-providers` | Swap Main (right) and Secondary (left) sidebars |
| 114 | **Remove Top Preset Badge**: Permanently suppress preset badges at top of conversation area | IN PROGRESS | `dsh-tweaks` | Suppress conversation.session.header.actions badge |
