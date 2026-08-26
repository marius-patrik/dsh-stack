---
date: 2026-08-26
session: worktrees/pr-22 (post-PR-22 hardening session)
issues: [58, 59]
status: scoped
---

## Request/PRD/implementation-plan issue workflow, autonomous GitHub agent, requests/ folder convention

> scope the review and roadmap work as well and everything else - basically every user input should file or alter and existing request issue -- lets have types of issues master - tracking, child - implementation plan + product documentation (should become notes), request - user request with exact wording and comments interaciton with github agent (our custom agent for github that should be fully autonomus - extracted/ inspired from darkfactory) to scope the request - that then becomes the prd issue that opens a branch and pushes doc update and then that should move to the implementation plan issue and then we can add a ci workflow for the initial implementation as well -- add requests folder next to notes that gets a file for all user requests files dont have to be per turn bundle them some nice way instead can have multiple messages in one file but keep the exact wording and you can add a semantic decomposition, use yaml frontmatter markdown for the notes and requests, add accompanying skills and tools to the repo system --- well want to decompose all of this across the entire code profile surfae as well graphs agents loops tools .......

> and not just this all existing repo rules should be transformed as well

> also /rules folder with file every longstanding rules /automations for automations - new plugin, add acompanying skills and hooks as well - the repo can have /loops /graphs for the actual repo specific implementation - it should rely fully on the selfhosted ci runner (implemented as an extension and in ui) running dsh in containers

### Semantic decomposition

- Every user input should either file a new "request" issue or amend an existing one — no user message should go un-tracked.
- Four issue types, each a distinct stage in a pipeline:
  1. **request** — verbatim user ask, comments carry the GitHub agent's scoping conversation.
  2. **prd** — the GitHub agent's scoped output; opening a PRD issue also opens a branch and pushes a doc update (into `.agents/notes/`).
  3. **implementation-plan** — derived from the PRD issue once accepted; this is where a concrete build plan lives.
  4. **master/tracking** — aggregates child issues (already partly established this session via `epic`-labeled issues #45/#56; this generalizes the pattern and gives it its own label distinct from ad hoc epics).
- A custom, fully autonomous **GitHub agent** (in spirit inspired by/extracted from the "DarkFactory" reference project already absorbed into `profile-coding`) is the thing that:
  - Reads a request issue and its comment thread.
  - Scopes it into a PRD issue (opens a branch, writes/updates a `.agents/notes/` doc as that branch's commit).
  - Progresses an accepted PRD into an implementation-plan issue.
  - Can trigger a CI workflow that attempts the initial implementation off that plan.
  - This is a superset/generalization of the autoreview/autofix/autodoc agent already scoped in issue #52 — likely the same underlying headless-agent + model-routing infrastructure, applied to a different trigger (issue lifecycle events, not just PR diffs).
- New `.agents/requests/` folder, sibling to `.agents/notes/`: one file per bundled burst of related user requests (not strictly one-per-turn), YAML frontmatter + Markdown, exact verbatim quotes preserved, with a "semantic decomposition" section per burst (this file is the first instance of that convention).
- `.agents/notes/` docs also standardize on YAML-frontmatter Markdown (not all existing notes currently have frontmatter — a normalization pass is implied, not yet done).
- Add accompanying skills and tools to the repo (Claude Code skills / MCP-style tools, or dsh-native equivalents) that operationalize this workflow, so a human or agent has a direct action ("file a request," "scope into PRD," "promote to implementation plan") rather than only a documented convention.
- This entire request/PRD/implementation-plan/master pipeline should itself be decomposed across the existing profile-surface primitives from the Aethelgard epic (#56) — dsh-graphs (workflow steps: request→PRD→plan→CI), dsh-agents/persona-runtime (the GitHub agent as a persona/preset), dsh-loops (a standing loop watching for new/updated request issues), dsh-jobs (the CI-triggered implementation attempt as a job) — rather than being a bespoke one-off automation living outside that architecture.
- **Follow-up in the same burst**: this isn't scoped to just the new request/PRD workflow — *all existing repo rules* (everything currently in `.agents/AGENTS.md`) should also be transformed to live on/be expressed through the same graphs/agents/loops/tools profile-surface primitives, not remain a separate static-Markdown-only rule set parallel to the executable architecture. I.e. the target end state is that AGENTS.md's policies (branch/merge policy, verification standard, file granularity, issue/roadmap/dispatch policy, etc.) are themselves represented as loop/graph/agent definitions the system can execute and check against, with the Markdown as the human-readable projection of that, not the only copy of the rule.

- **Second follow-up in the same burst** — two more repo-root folders alongside `.agents/requests/` and `.agents/notes/`:
  - `/rules` (or `.agents/rules/`) — one file per longstanding repo rule (the durable, individually-addressable form of what's currently bundled into one `AGENTS.md`), so a rule can be referenced, versioned, and eventually bound to an executable check independently of the others.
  - `/automations` — a **new plugin** (abstraction) for repo automations, with its own accompanying skills and hooks (Claude Code skills, and git/CI hooks), analogous to how `/rules` decomposes AGENTS.md, but for the automation/agent side (autoreview, autodoc, the GitHub agent, etc. from #52/#59 become extensions of this plugin rather than living wherever is convenient).
  - `/loops` and `/graphs` — repo-root folders holding the *actual repo-specific* loop and graph definitions (concrete instances authored against the `dsh-loops`/`dsh-graphs` primitives from #56), distinct from those packages' own source, which only defines the generic engines.
- **Runtime dependency**: all of the above (automations, loops, graphs, CI-triggered implementation attempts) should run fully on the self-hosted CI runner infrastructure, not ad hoc — specifically:
  - The self-hosted runner itself becomes a first-class **extension** (not just an operational setup done by hand this session) with real UI representation (status/health visible in the Stack UI, not only `gh api`/`launchctl` inspection).
  - It runs **dsh in containers** — i.e. the runner's execution environment is containerized dsh instances, not the bare-metal `node --import tsx/esm ...` process currently started by hand (or by the `dsh` launcher) on the host.

### Scoping note

This request is broad enough that it should NOT be implemented as one PR. Filed as master issue #59 (PR #58 lands the `requests/` folder itself) with the pipeline stages, folder scaffolds (`.agents/rules/`, `/automations`, `/loops`, `/graphs`), label types (`type:master`, `type:request`, `type:prd`, `type:implementation-plan`), and the self-hosted-runner-as-extension/dsh-in-containers requirement all tracked as explicit children; the GitHub agent itself, the automations plugin, the dsh-graphs/loops/jobs decomposition, the notes/ frontmatter normalization pass, and the containerized self-hosted-runner extension are each their own child issue to be filed and worked independently.
