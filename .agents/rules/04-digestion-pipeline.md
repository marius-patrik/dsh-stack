# Rule: Digestion Pipeline

**Enforcement:** mandatory  
**Scope:** all user input → all work output  
**Hook:** enforced by pre-commit (doc freshness) + commit-msg (phase-closing docs)

## Overview

Every user prompt enters a digestion pipeline that transforms raw input into
tracked, planned, executed, and promoted work. The pipeline has five stages:

```
REQUEST → BACKLOG → PLAN → TASKS → CODE → PRD
```

No stage is skipped. No work happens outside the pipeline.

---

## Stage 1: REQUEST ( ingestion )

Every user prompt becomes a **request** in the `.agents/requests/` folder.

- File: `.agents/requests/<timestamp>-<slug>.md`
- Content: the raw user prompt, verbatim, plus any immediate context
- Status: `new`

The request is the immutable record of what the user asked for. It is never
modified after creation.

**Trigger:** every user message that contains work instructions (not casual
chat).

---

## Stage 2: BACKLOG ( triage )

Requests are triaged into BACKLOG.md rows. Each row gets:

- **Feature** — what the user wants (clearly stated, not vague)
- **Size** — S / M / L / XL
- **Owner** — which plugin or area owns it
- **Status** — OPEN / IN PROGRESS / DONE / BLOCKED / QUESTION
- **Request ref** — link to the request file

If the request is clear and actionable → OPEN status.  
If the request needs clarification → QUESTION status (see vague-input rule).  
If the request is blocked by something → BLOCKED status (see blocked-gate rule).

**Trigger:** every new request file.

---

## Stage 3: PLAN ( design )

When an OPEN backlog item is about to be worked, it MUST be planned in
PLAN.md before any code is written.

Planning means:
1. **Design decisions** documented (architecture, approach, tradeoffs)
2. **Dependencies** identified (what must be done first)
3. **Subtasks** broken down (if L or XL, split into smaller units)
4. **Questions** surfaced (if planning reveals ambiguity → back to BACKLOG
   with QUESTION status, work something else)

The plan entry includes:
- Phase or section reference
- Technical approach
- Files to create/modify
- Verification method (check-plugin, typecheck, manual test)

**Trigger:** before any code change for a backlog item.

---

## Stage 4: TASKS ( execution )

Planned items become **tasks** in the todo list. Each task:

- Maps 1:1 to a backlog row
- Gets assigned to a **subagent** (see subagent-utilization rule)
- Has a clear completion criterion
- Gets a **build → review → fix** loop until good enough

Execution flow:
1. Create todo items from planned subtasks
2. Assign each task to a fit subagent (provider/model selection per
   subagent-utilization rule)
3. Subagent builds the task
4. Review: typecheck, check-plugin, manual verification
5. If not good enough → fix loop (subagent iterates)
6. If good enough → commit + push

**Trigger:** when a backlog item moves to IN PROGRESS.

---

## Stage 5: PRD ( promotion )

When a task is finished and verified, it is **promoted** to PRD.md.

Promotion means:
- The feature is documented in the relevant PRD section
- The PRD reflects the actual implemented behavior (not just the plan)
- Any deviations from the original plan are noted
- The backlog row is marked DONE

PRD.md is the **source of truth** for what the system actually does,
not what it was planned to do.

**Trigger:** after commit + push of a verified feature.

---

## Pipeline rules summary

| Rule | File | Enforcement |
|------|------|-------------|
| Context load | `01-context-load.md` | Agent self-enforced at session start |
| Blocked gate | `02-blocked-gate.md` | Pre-commit validates BLOCKED.md |
| Vague input | `03-vague-input.md` | Agent self-enforced mid-execution |
| Digestion pipeline | `04-digestion-pipeline.md` | Pre-commit + commit-msg |
| User input gate | `05-user-input-gate.md` | Agent self-enforced |
| Subagent utilization | `06-subagent-utilization.md` | Agent self-enforced per task |

---

## Why

Without a pipeline, work happens ad-hoc:
- User requests get lost or forgotten
- Work happens without design decisions being recorded
- Features ship without PRD updates
- The system's actual behavior drifts from its documented behavior

The pipeline ensures every user input is tracked, every design decision is
recorded, every task is verified, and the PRD always reflects reality.
