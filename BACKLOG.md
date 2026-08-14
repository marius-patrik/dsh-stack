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

## 3. Already shipped (knocked off — check these first)

These are the plugins we built in session 1. Any backlog item below that overlaps is
knocked off or marked partial.

| Plugin | Status | Covers (parity-relevant) |
|---|---|---|
| `dsh-dialects` | shipped + boot-verified | Provider **wire dialects**: openai, claude, gemini |
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
| 1 | Interfaces | Desktop app (macOS/Win/Linux) | XL | OPEN | `dsh-desktop` (P3) | Tauri v2 chromeless shell + lifecycle plugin |
| 2 | Interfaces | Terminal TUI as shipped default profile | L | OPEN | `dsh-tui` (P1 scaffold) | Cannibalize opencode TUI → client-only for dsh |
| 3 | Models | Curated model gateway | XL | OPEN | product | Zen-analog; product decision, not plugin |
| 4 | Models | Low-cost subscription to tested open models | XL | PARTIAL | `dsh-subscriptions` | single-seat remap shipped; hosted gateway open |
| 5 | Models | Broad provider catalog (75+ via Models.dev) | L | PARTIAL | `dsh-providers` (P7) | native catalog + adapters exist; breadth open |
| 6 | Collaboration | Public session share links | M | OPEN | `dsh-tweaks` (P2) | self-hosted `/share/:id`, readonly default, token-gated interactive |
| 7 | Git | GitHub integration (PR/commit workflows) | L | PARTIAL | `dsh-credentials` + `dsh-repos` (P6) | GitHub OAuth account in vault (credentials); branch/commit/push/PR (repos) |
| 8 | Git | GitLab integration | S | OPEN | `dsh-repos` (later) | — |
| 9 | Git | Repo-analysis agentic init → `AGENTS.md` | M | OPEN | `dsh-repos` (later) | dsh reads AGENTS.md; doesn't generate |
| 10 | Session UX | `/undo` `/redo` | S | OPEN | `dsh-tweaks` (P2) | wire `session-checkpoint-policy` |
| 11 | Session UX | First-class Plan/Build toggle | S | OPEN | `dsh-tweaks` (P2) | wire `plan-mode` |
| 12 | Session UX | Drag-and-drop images into prompt | S | OPEN | `dsh-tweaks` (P2) | wire `attachment` seam |
| 13 | Session UX | Custom slash commands | M | OPEN | `dsh-tweaks` (P2) | expose `commands` registry in settings |
| 14 | Session UX | Keybind customization | S | OPEN | `dsh-tweaks` (P2) | greenfield config surface |
| 15 | Session UX | Themes | S | OPEN | `dsh-themes` (P4) | VS Code/TextMate; file install + Open VSX catalog |
| 16 | Session UX | Code formatters (auto-format on edit) | M | OPEN | `dsh-formatters` (P5) | LSP `formatDocument` via `lsp-stdio` |
| 17 | Agent config | Custom agents as JSON/Markdown files | M | PARTIAL | `dsh-agents` (P6) | `agent-presets`/`persona` seams |
| 18 | Agent config | Config-file custom tools | M | PARTIAL | `dsh-tools` (P6) | scoped tool registry + `tool-cordis` |
| 19 | Observability | Token/cost stats CLI | S | OPEN | `dsh-tweaks` (P2) | `dsh stats` on `session-stats`/`token-meter` |
| 20 | Observability | Session list CLI | S | OPEN | `dsh-tweaks` (P2) | part of `dsh stats` surface |
| 21 | Maturity | GA stability guarantee + migration story | L | OPEN | — | dev preview; breaking changes expected |

**Net remaining work (OPEN, by area + owner):**
- `dsh-desktop` (P3): desktop app (1)
- `dsh-tui` (P1 scaffold, impl later): TUI default (2)
- product: curated gateway (3)
- `dsh-subscriptions`: hosted gateway product (4-remainder)
- `dsh-providers` (P7): catalog breadth (5-remainder)
- `dsh-tweaks` (P2): share links (6), undo/redo (10), Plan/Build (11), drag-drop (12),
  slash commands (13), keybinds (14), stats CLI (19), session list CLI (20)
- `dsh-credentials` + `dsh-repos` (P6): GitHub workflows (7-remainder)
- `dsh-repos` (later): GitLab (8), agentic init (9)
- `dsh-themes` (P4): themes (15)
- `dsh-formatters` (P5): formatters (16)
- `dsh-agents` (P6): agent files (17-remainder)
- `dsh-tools` (P6): tool files (18-remainder)
- —: GA (21)

Phase order (from PLAN.md): P1 scaffold → P2 tweaks v2 (share/observability/session-UX,
the densest round) → P3 desktop → P4 themes → P5 formatters → P6 partials → P7 provider
breadth. Session-UX S-items (10, 11, 14) are the cheapest first slices within P2.

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
  `CLAUDE_SUB_OAUTH_TOKEN`, `CURSOR_SUB_TOKEN`, `GROK_SUB_OAUTH_TOKEN`,
  `GEMINI_SUB_COOKIE_*`, `KIMI_SUB_OAUTH_TOKEN`, `KIMI_API_KEY`. Done.

Deferred plugin candidates (port-source kept in Andromeda): `src/cli/orchestrator.ts`
(baton/heartbeat), `src/cli/memory.ts` (durable memory), remaining `src/cli/state*.ts`.
