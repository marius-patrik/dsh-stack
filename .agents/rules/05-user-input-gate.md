# Rule: User Input Gate

**Enforcement:** mandatory  
**Scope:** design decisions, scope changes, priority choices  
**Hook:** agent self-enforced

## Requirement

When a task requires the user's decision, preference, or sign-off — on scope,
design, naming, priority, or any choice that affects the product — the agent
MUST stop and document the question before doing the work.

## Flow

1. Agent identifies that a decision needs user input
2. Agent writes the question to:
   - **CONTEXT.md** — under the current session section
   - **BACKLOG.md** — as a note on the relevant row with status QUESTION
3. Agent includes the options/tradeoffs so the user can make an informed choice
4. Agent does NOT proceed with the implementation until the user answers
5. After the user answers, agent records the decision in CONTEXT.md and proceeds

## What requires user input

- Design choices with multiple valid answers (architecture, naming, UX flows)
- Scope decisions (what to include/exclude in a feature)
- Priority ordering between independent tasks
- Any change that could surprise the user or alter existing behavior

## What does NOT require user input

- Pure technical execution (typecheck passes, tests green, docs updated)
- Choosing internal implementation details that don't affect user-facing behavior
- Following established conventions already documented in PLAN.md
- Fixing bugs (the fix is obviously correct)

## Why

Without this rule, agents either:
- Stop and pesters the user for every minor decision (wasting time)
- Make product decisions on behalf of the user (overstepping)
- Guess wrong and have to redo work

The correct behavior is: stop at genuine decision points, document the
question, continue with unblocked work in the meantime.
