# Rule: Subagent Utilization

**Enforcement:** mandatory  
**Scope:** all task execution  
**Hook:** agent self-enforced

## Requirement

Every task in the pipeline MUST be executed by a subagent, not the main agent.
The main agent orchestrates; subagents execute.

## Subagent selection

Choose the subagent type based on the task:

| Task type | Subagent | Provider/Model |
|-----------|----------|----------------|
| Code implementation | `general` | Primary model (claude-haiku-4-5 or current default) |
| Codebase exploration | `explore` | Primary model |
| Research / web search | `general` | Primary model with websearch enabled |
| Documentation writing | `general` | Primary model |
| Testing / verification | `general` | Primary model |
| Multi-step complex task | `general` | Primary model |

## Provider quota utilization

When multiple tasks can run in parallel, distribute them across available
provider quotas to avoid hitting rate limits on a single provider:

1. Check which providers have available quota (via `dsh-quotas` snapshots)
2. Assign tasks to subagents using different providers when possible
3. If a provider is rate-limited, fail over to the next available provider
4. Never block the entire pipeline on a single provider's quota

## Build → Review → Fix loop

Every subagent task follows:

1. **Build**: subagent implements the task
2. **Review**: main agent reviews the output (typecheck, check-plugin, diff review)
3. **Fix**: if not good enough, subagent iterates (max 3 fix rounds)
4. **Promote**: if good enough, commit + push + promote to PRD

The review loop is NOT optional. Every task gets reviewed before shipping.

## Parallelism

When multiple independent tasks exist in the backlog:
- Launch multiple subagents concurrently
- Each subagent works on one task
- Main agent reviews results as they come in
- Never serialize work that can be parallelized

## Why

Without this rule:
- The main agent does all the work itself (slow, context-limited)
- Tasks are serialized even when they could be parallel (wasted time)
- No review happens before code ships (bugs ship)
- Provider quotas are wasted (one provider overloaded, others idle)
