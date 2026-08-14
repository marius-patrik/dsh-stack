# AGENTS.md

Guidance for any agent (human or AI) working in this repository.

## Mission

`agents` is a personal agent stack built on top of the DeepSeek Harness (`dsh`).
**Everything is a harness plugin.** The harness checkout (`harness/`) is the
upstream source, pinned and kept pristine — never edit it. Andromeda
(`~/Andromeda`, `marius-patrik/Andromeda`) is the porting SOURCE for future
plugins; it is not part of this project. Removed-from-Andromeda = progress marker.

## The docs rule (IMPORTANT)

PLAN.md, CONTEXT.md, BACKLOG.md, and README.md are the living memory of this
project. **Every code/phase change ships with its doc updates in the same
commit.** Specifically:

- `PLAN.md` — authoritative plan: repos, mapping, phases, dependency policy.
  Update phase status lines (`[complete]`, `[in progress]`, etc.) as work lands.
- `CONTEXT.md` — strictly chronological session run-through. **Append** new
  sessions; never rewrite history. Newest session is always last.
- `BACKLOG.md` — parity delta re-keyed by owning plugin. Move/annotate rows as
  plugins ship.
- `README.md` — repo layout + state; update when the layout changes.

If you make a code change, you must also update the relevant docs in the same
commit.

## Commit cadence (IMPORTANT)

**Commit + push to GitHub at the end of every phase** so progress is visible.
A "phase" is any coherent unit of work (a PLAN.md phase, a plugin, a doc round).
Never sit on uncommitted work across a phase boundary. Commit messages: short
(`<verb>: <subject>`, e.g. `docs: add AGENTS.md and P7 roadmap`). Submodule
plugins are committed in their own repos first, then the superproject pin is
committed + pushed.

## Repo layout

```
AGENTS.md       this file
PLAN.md         authoritative plan (repos, mapping, phases, dependency policy)
CONTEXT.md      chronological session memory (append-only)
BACKLOG.md      opencode-parity delta re-keyed by owning plugin
README.md       layout + state
harness/        pinned deepseek-harness submodule (deepseek-ai/deepseek-harness),
                KEPT PRISTINE — never edit, never commit changes
plugins/        one repo per plugin, each a git submodule of this superproject:
                dsh-dialects, dsh-providers, dsh-credentials, dsh-tweaks,
                dsh-subscriptions, (+ planned: dsh-tui, dsh-desktop,
                dsh-themes, dsh-formatters, dsh-tools, dsh-agents, dsh-repos)
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

1. Read PLAN.md + CONTEXT.md first to orient.
2. For new features: confirm which plugin owns it (see BACKLOG.md mapping).
3. Implement + boot-verify with `check-plugin.mjs`.
4. Update docs (PLAN.md status, CONTEXT.md if a session boundary, BACKLOG.md
   row status, README if layout changed).
5. Commit + push (plugin repo first, then superproject pin).
