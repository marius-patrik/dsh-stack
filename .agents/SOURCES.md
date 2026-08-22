# DSH Stack Source Absorption Map

Status: active rewrite directive
Date: 2026-08-22

This file records repositories whose useful implementations are being absorbed into DSH Stack. None is a runtime dependency or a competing product after migration.

## Andromeda

Repository: `marius-patrik/Andromeda`

Status: archived as active product; source archive only.

Absorb selectively:
- credential/vault domain behavior;
- provider/account/authentication logic;
- OAuth and secret handling where still useful;
- model/provider adapters and shared domain types;
- state/configuration behavior;
- command/data routing and reusable tests/fixtures.

Do not preserve the old application, server, CLI, or persistence architecture.

## dsh-web-ui

Repository: `zhu1090093659/dsh-web-ui`

Role: primary source/base for Stack tab/workspace functionality.

Absorb selectively:
- tabs and workspace behavior;
- task/workspace surfaces;
- Git graph and related views where useful;
- remote/workspace mechanisms where product requirements retain them;
- skins/theme behavior where compatible.

Rebase the useful implementation against the chosen DSH baseline and make the Stack implementation canonical.

## DSH-better-sidebar

Repository: `zhu1090093659/DSH-better-sidebar`

Role: primary sidebar/workspace reference.

Absorb selectively:
- service-oriented sidebar API;
- tab/viewer registration model;
- file explorer/editor/browser/terminal/Git/background-task surfaces;
- session-scoped layout persistence;
- lazy loading;
- plugin registration APIs;
- mutual-exclusion/ownership behavior.

There must be one canonical Stack sidebar/workspace implementation. Do not ship both better-sidebar and another equivalent sidebar implementation.

## dsh-trading

Repository: `maddogfinance/dsh-trading`

Role: primary trading-profile architectural and implementation reference.

Absorb selectively:
- market-data seam;
- provider model;
- deterministic indicators and market analysis tools;
- research-only/risk-guard architecture;
- chart cards and chart workspace;
- trading frame/profile composition;
- research contracts and verification concepts.

## moneymaker

Repository: `marius-patrik/moneymaker`

Role: second major trading source to absorb into the trading profile.

Absorb selectively:
- strategy interface and strategy discovery;
- multi-symbol/multi-bar strategy support;
- deterministic backtesting;
- multi-window evaluation;
- train/test separation;
- parameter grid search;
- strategy fork/evaluation and evolution concepts;
- risk sizing;
- multi-account model;
- market-data provider abstractions;
- execution-provider seam;
- economic-release calendar;
- trade/session logging;
- background jobs.

Do not import its Python/FastAPI/React application architecture. Merge equivalent concepts with dsh-trading and DSH primitives.

## skyagent

Repository: `marius-patrik/skyagent`

Status: explicitly marked archived as a standalone product; source material only.

Role in Stack: domain/application capability source. The repository deliberately kept model selection, provider routing, shared memory, model sessions, identity and orchestration outside SkyAgent; DSH Stack now owns those concerns centrally.

Absorb selectively:
- deterministic Hypixel SkyBlock API/domain clients;
- profile, inventory, museum, economy, progression and readiness calculations;
- net-worth and pricing logic;
- domain context capsules and freshness/degraded-data semantics;
- structured objectives/planning behavior;
- domain playbooks and model-facing tool contracts;
- shared CLI/TUI/web surface concepts where useful.

The preferred result is a Stack domain integration/capability with any focused gaming/SkyBlock profile determined later by the product architecture. Do not recreate SkyAgent's separate model/session/provider/memory architecture.

## darkfactory

Repository: `marius-patrik/darkfactory`

Status: explicitly marked archived as a standalone product; source material only.

Role in Stack: project/repository automation and control-plane source.

Absorb selectively:
- GitHub App event intake;
- deterministic planning/orchestration;
- repository-local policy synchronization;
- managed-repository registry concepts;
- enforcement and workflow policy;
- follow-through, recovery and autoreview orchestration;
- isolated automated review jobs;
- release admission/completion and automation concepts.

Map these into Stack's repository, planning, jobs, automation, policy and agent-team capabilities. Do not retain DarkFactory's separate Agent OS control-plane or configuration/state architecture.

## Canonicalization rule

For each absorbed capability:

1. identify the strongest existing DSH primitive;
2. identify an existing Stack implementation of the same concept;
3. recover the best implementation/behavior from the source repositories;
4. merge into one canonical Stack service/capability;
5. delete or supersede duplicate implementations;
6. add integration and regression tests;
7. record the source lineage in the relevant package documentation.

Source repositories are references and migration inputs. They are not parallel implementations of DSH Stack.
