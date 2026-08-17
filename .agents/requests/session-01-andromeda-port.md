# Request: Andromeda → dsh port project (Session 1)

> Source: CONTEXT.md session 1 (`ses_002adefbcffe`, 1375 msgs, Aug 13-14 2026)
> Backfilled: 2026-08-17

## What happened

Started as a private fork of opencode ("pastacode") for subscription support, pivoted
to DeepSeek Harness (dsh) when user discovered it was a better fit for customization.
Cloned deepseek-harness, agreed on plugin architecture, state folder (.agents),
provider dialect abstraction, and credential manager.

## User directives (preserved verbatim)

- "deepseek released a harness... built for customization first... much better fit...
  no need for a fork, just install it... each capability should become a plugin."
- Everything that is not core harness = a plugin.
- Each plugin = a git repo that is a submodule under the agents superproject.
- State folder: hybrid, renamed from dsh → .agents.
- Provider dialect abstraction with bundled dialects: openai, claude, gemini.
- dsh-llm-subscriptions renamed → dsh-providers.
- dsh-tweaks: "just some sort of main string config".
- Credentials manager: full account/credential manager for ALL the user's accounts
  (phase 2, deferred); for now only needs to unlock the LLMs.
- Cadence rule: commit + push at end of every phase.

## What was built

- agents superproject on GitHub (marius-patrik/agents)
- 5 plugins shipped + boot-verified: dsh-dialects, dsh-credentials, dsh-providers,
  dsh-tweaks, dsh-subscriptions
- P6 credentials v2 (full Andromeda vault parity) complete
- Andromeda decommission executed (commit c6d8cda)
- Port-source kept: orchestrator, memory, state files

## Status

Completed. All 5 initial plugins shipped. Decommission done.
