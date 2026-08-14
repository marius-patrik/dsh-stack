# agents

Personal agent stack on top of DeepSeek Harness (`dsh`). Everything is a harness plugin.

## Layout

- `harness/` — pinned checkout of `deepseek-ai/deepseek-harness` (source of truth, kept pristine).
- `plugins/` — one private repo per plugin, each a git submodule:
  - `dsh-dialects/` — provider wire-protocol abstraction (bundled: openai, claude, gemini).
  - `dsh-providers/` — LLM provider adapters (kimi-code, kimi-sub, claude-sub, cursor-sub, grok-sub, gemini-sub).
  - `dsh-credentials/` — account/credential manager (v1: LLM-enabling; v2: full manager).
  - `dsh-tweaks/` — general features: providers filter, state-folder (`homeRoot`) + command config.
  - `dsh-subscriptions/` — profile bundle mounting providers + credentials + defaults.
- `scripts/dsh` — launcher: checks current state home, adjusts to configured root, execs the harness binary.

## State

- `DSH_HOME` = `~/.agents` by default (configurable via `dsh-tweaks` `homeRoot`).
- The state folder is never committed.
