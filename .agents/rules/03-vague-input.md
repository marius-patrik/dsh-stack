# Rule: Vague Input Gate

**Enforcement:** mandatory  
**Scope:** mid-execution ambiguity  
**Hook:** none (agent self-enforced)

## Requirement

When the user provides vague, ambiguous, or underspecified input during
execution, the agent MUST:

1. **Record the ambiguity** in BACKLOG.md as a new row with status QUESTION
2. **Continue working** on a clear, unblocked task from the existing backlog
3. **NOT block** waiting for the user to clarify

## What counts as vague input

- "make it better" (without specifying what "better" means)
- "add the thing" (without specifying which thing)
- "fix it" (without specifying what's broken)
- "do the rest" (without specifying what "the rest" includes)
- Any input that requires interpretation or choice between valid options

## Flow

1. Agent receives vague input mid-execution
2. Agent writes a BACKLOG row: `[status: QUESTION] <what was asked> — needs: <what's missing>`
3. Agent picks the next clear, unblocked task from BACKLOG
4. When the user clarifies, the QUESTION row is updated and becomes actionable

## Why

Without this rule, the agent either:
- Stops and pesters the user for clarification (wasting time)
- Guesses and does the wrong thing (wasting work)
- Gets stuck in a loop trying to interpret the input

The correct behavior is: record the question, keep working, revisit when the
user has more context.
