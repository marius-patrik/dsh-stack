# Rule: Full Context Load

**Enforcement:** mandatory  
**Scope:** every agent session  
**Hook:** enforced at session start (pre-task gate)

## Requirement

When any agent (human or AI) picks up work on this project, it MUST load the
full context system before writing any code. This is non-negotiable.

## Required reads (in order)

1. **AGENTS.md** — repo conventions, plugin structure, workflow rules
2. **PLAN.md** — authoritative plan: phases, repos, mapping, dependency policy
3. **CONTEXT.md** — chronological session memory (read last 2 sessions minimum)
4. **BACKLOG.md** — parity delta, open items, owner mapping
5. **BLOCKED.md** — harness seam audit (if working on harness-adjacent features)
6. **PRD.md** — product requirements (if working on UI/UX features)

## Why

Without context loading, agents:
- Duplicate work that was already done
- Re-open decisions that were already made
- Miss blockers that were already identified
- Break conventions that were already established
- Create inconsistent code that doesn't match the existing patterns

## Enforcement

The pre-commit hook verifies that CONTEXT.md has a session section for today
if any code changed. This rule goes further: the agent itself must read the
docs before starting work.

If the agent cannot find or read these files, it must stop and report the
failure rather than proceeding blind.
