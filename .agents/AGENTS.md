# AGENTS.md

Guidance for any agent (human or AI) working in this repository.

## Mission

`dsh-stack` is a personal agent stack built on top of the DeepSeek Harness
(`dsh`). **Everything is a harness plugin.** The harness checkout (`harness/`)
is the upstream source, pinned and kept pristine — never edit it. Andromeda
(`~/.andromeda`, `marius-patrik/Andromeda`) is the porting SOURCE for future
plugins; it is not part of this project. Removed-from-Andromeda = progress
marker.

## The rules system (IMPORTANT)

All workflow rules live in `.agents/rules/`. Every agent MUST load and follow
these rules. The rules are enforced by hooks AND by agent self-discipline.

| Rule | File | Purpose |
|------|------|---------|
| Context load | `01-context-load.md` | Full context system loaded at session start |
| Blocked gate | `02-blocked-gate.md` | Blocked items → BLOCKED.md |
| Vague input | `03-vague-input.md` | Vague input → BACKLOG.md, keep working |
| Digestion pipeline | `04-digestion-pipeline.md` | REQUEST → BACKLOG → PLAN → TASKS → CODE → PRD |
| User input gate | `05-user-input-gate.md` | Design decisions need user sign-off |
| Subagent utilization | `06-subagent-utilization.md` | Subagents execute, main agent orchestrates |

**Read `.agents/rules/` before doing anything else.**

## The docs rule (IMPORTANT)

All project docs live under `.agents/` (this directory). They are the living
memory of this project. **Every code/phase change ships with its doc updates in
the same commit.** Specifically:

- `PLAN.md` — authoritative plan: repos, mapping, phases, dependency policy.
  Update phase status lines (`[complete]`, `[in progress]`, etc.) as work lands.
- `CONTEXT.md` — strictly chronological session run-through. **Append** new
  sessions; never rewrite history. Newest session is always last.
- `BACKLOG.md` — parity delta re-keyed by owning plugin. Move/annotate rows as
  plugins ship. Every backlog row that is being worked MUST also appear in the
  todo list (tasks).
- `BLOCKED.md` — harness seam audit + active blockers.
- `PRD.md` — product requirements. Features are promoted here after completion.
- `README.md` — repo layout + state; update when the layout changes.

If you make a code change, you must also update the relevant docs in the same
commit.

## The digestion pipeline (IMPORTANT)

Every user prompt enters a pipeline. No work happens outside it.

```
REQUEST → BACKLOG → PLAN → TASKS → CODE → PRD
```

1. **REQUEST**: every user work prompt becomes a file in `.agents/requests/`
2. **BACKLOG**: requests are triaged into BACKLOG.md rows
3. **PLAN**: before coding, design decisions are documented in PLAN.md
4. **TASKS**: planned items become todo items, each assigned to a subagent
5. **CODE**: subagent builds, main agent reviews, fix loop until good enough
6. **PRD**: finished features are promoted to PRD.md

When a task moves from BACKLOG to PLAN, it MUST also appear in the todo list
(tasks). The todo list is the execution view of planned work.

## At every build start (IMPORTANT)

Before writing any code in a build round, ALWAYS do these things:

1. **Load the full context system** (rule 01): read AGENTS.md, PLAN.md,
   CONTEXT.md (last 2 sessions), BACKLOG.md, and BLOCKED.md/PRD.md as needed.
2. **Open the todo list** (`todowrite`): lay out the phases/features for this
   build round as todos, and keep them updated as work progresses.
3. **Append a new CONTEXT.md session section** (chronological, always last)
   recording what this round is building, the phase list, and today's date —
   BEFORE the first code change lands.
4. **Create request files** for any new user input that contains work
   instructions.

Skip nothing. The docs rule, commit cadence, and this build-start ritual together
keep the memory files truthful and the todos auditable.

## Commit cadence (IMPORTANT)

**Commit + push to GitHub at the end of every phase** so progress is visible.
A "phase" is any coherent unit of work (a PLAN.md phase, a plugin, a doc round).
Never sit on uncommitted work across a phase boundary. Commit messages: short
(`<verb>: <subject>`, e.g. `docs: add AGENTS.md and P7 roadmap`). Submodule
plugins are committed in their own repos first, then the superproject pin is
committed + pushed.

## Repo layout

```
.agents/        this directory — project docs (PLAN, CONTEXT, BACKLOG, AGENTS,
                PRD, BLOCKED) + workflow hooks + rules + requests
harness/        pinned deepseek-harness submodule (deepseek-ai/deepseek-harness),
                KEPT PRISTINE — never edit, never commit changes
plugins/        one repo per plugin, each a git submodule of this superproject:
                dsh-dialects, dsh-providers, dsh-credentials, dsh-tweaks,
                dsh-subscriptions, dsh-desktop, dsh-themes, dsh-formatters,
                dsh-lsp, dsh-tools, dsh-agents, dsh-repos, dsh-session-modes,
                dsh-quotas, dsh-tui, dsh-translator
scripts/dsh     homeRoot/command-aware launcher; also owns plugin verb routes
                (e.g. `dsh accounts` → plugins/dsh-credentials/bin/accounts.mjs)
```

## Plugin conventions

Each plugin is a git repo (submodule here) under `marius-patrik`, named
`dsh-<purpose>`. Visibility: public unless stated in PLAN.md (only
`dsh-subscriptions` is private). Scaffold shape (mirror `dsh-tweaks`):

- `src/*.ts` — TS sources, compiled by `tsc` to `lib/` (`tsconfig.json` as in
  `dsh-tweaks`: NodeNext, strict, `rootDir: src`, `outDir: lib`).
- `package.json` — `name: dsh-<purpose>`, `main`/`types` → `lib/index.js|.d.ts`,
  `exports` including `"./src/*": "./src/*"`, `files: ["lib"]`, peerDeps on
  `@deepseek-ai/cordis` (+ any harness seams used), `typecheck` +
  `test: node check-plugin.mjs`.
- `check-plugin.mjs` — boot-verify harness (see below). Every plugin has one.
- NO zod anywhere. Validation uses `@deepseek-ai/schemastery` (via the
  `vault/zod.ts` compat shim in dsh-credentials when porting Andromeda code).
- Plugin module shape: `export const name`, `export const inject: string[]`,
  `export const Config` (schemastery schema), `export function apply(ctx, config)`.
  No default export.
- `check-plugin.mjs` MUST assert: name, `apply` is function, `inject` is array,
  no default export; then boot the plugin over stub `ctx` services and exercise
  its real behavior (mirror, vault round-trips, etc.). Pure Node, no test runner.
- New plugin → add its repo as a submodule + a row in PLAN.md's repo table +
  entry in README layout. Commit cadence applies.

## State / environment

- `$DSH_HOME` = `~/.agents` by default, overridable via `dsh-tweaks.homeRoot`.
- The launcher (`scripts/dsh`) resolves the home, reads `settings.yaml`'s
  `dsh-tweaks:` section, migrates state additively on homeRoot move, applies
  `dsh-tweaks.command` when no subcommand is given, and routes plugin verbs
  (`accounts`) before exec'ing the harness CLI
  (`harness/apps/cli/lib/bin.js`).
- State folder is never committed.
- The harness is a dev-preview; breaking changes expected. Keep harness pinned;
  bump only deliberately.

## Workflow

1. **Load context** (rule 01): read AGENTS.md + PLAN.md + CONTEXT.md + BACKLOG.md.
2. **Digest input** (rule 04): every user prompt → request file → BACKLOG row.
3. **Plan before coding**: design decisions in PLAN.md, questions back to BACKLOG.
4. **Execute via subagents** (rule 06): each task → subagent → build → review → fix.
5. **Update docs** (PLAN.md status, CONTEXT.md session, BACKLOG.md row status).
6. **Commit + push** (plugin repo first, then superproject pin).
7. **Promote to PRD** (rule 04): finished features documented in PRD.md.

## User input gate (IMPORTANT)

When a task requires the user's decision, preference, or sign-off — on scope,
design, naming, priority, or any choice that affects the product — **stop and
document the question before doing the work**. Specifically:

1. **Write the open question into CONTEXT.md** (under the current session) and
   into BACKLOG.md (as a note on the relevant row). Include the options or
   tradeoffs so the user can make an informed choice.
2. **Do NOT proceed with the implementation** until the user has answered.
3. After the user answers, record the decision in CONTEXT.md and proceed.

This applies to:
- Design choices with multiple valid answers (architecture, naming, UX flows)
- Scope decisions (what to include/exclude in a feature)
- Priority ordering between independent tasks
- Any change that could surprise the user or alter existing behavior

This does NOT apply to:
- Pure technical execution (typecheck passes, tests green, docs updated)
- Choosing internal implementation details that don't affect the user-facing
  behavior or product direction
- Following established conventions that are already documented in PLAN.md

## Hooks

Hooks live in `.agents/hooks/` and enforce workflow rules automatically:

### pre-commit
Validates that:
- PLAN.md, CONTEXT.md, BACKLOG.md, README.md are not stale (mtime < last
  commit's plugin changes)
- Every plugin submodule with dirty tree is staged
- No secrets (vault keys, OAuth client secrets) appear in staged files
- CONTEXT.md has a session section for today (if any code changed)
- No uncommitted check-plugin.mjs changes ship without corresponding src/ changes

### commit-msg
Validates that:
- Commit messages match the `<verb>: <subject>` convention
- Submodule pin commits reference the plugin commit hash
- Phase-closing commits include doc file updates

### pre-push
Validates that:
- All plugin check-plugin.mjs suites pass
- No `node_modules` or build artifacts are staged
- The superproject tree is coherent (submodule pins match committed hashes)

Install hooks: `cd /Users/user/agents && .agents/hooks/install.sh`
