# Rule: Blocked Gate

**Enforcement:** mandatory  
**Scope:** all work items  
**Hook:** pre-commit validates BLOCKED.md exists and is current

## Requirement

When work is blocked by a harness limitation, missing upstream feature,
dependency, or external factor, the blockage MUST be recorded in BLOCKED.md
before the agent moves on to something else.

## What goes in BLOCKED.md

Each blocked item gets:
- **ID** — sequential number
- **Feature** — what is blocked
- **Owner** — which plugin owns it
- **Blocker** — what specifically is blocking it (harness seam, upstream bug, etc.)
- **Evidence** — error messages, harness source references, issue links
- **Workaround** — if any exists
- **Status** — BLOCKED / UNBLOCKED / WONTFIX

## Flow

1. Agent encounters a blocker (e.g., harness missing a needed seam)
2. Agent writes the blocker to BLOCKED.md with full context
3. Agent marks the related BACKLOG row as BLOCKED
4. Agent continues with a different unblocked task
5. When the blocker is resolved, BLOCKED.md entry is updated and the
   BACKLOG row is reactivated

## Why

Without this rule, blockers get lost in session logs, work stalls while
the agent tries to work around the same issue repeatedly, and the user
doesn't know what's actually stuck.
