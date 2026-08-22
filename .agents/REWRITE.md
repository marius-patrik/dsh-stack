# DSH Stack Rewrite

Status: architecture baseline / rewrite preparation
Date: 2026-08-22

## Purpose

This document replaces the assumption that the current `dsh-stack` implementation is the architectural source of truth. It records the verified baseline, the current product direction, and the execution method for a repository-wide rewrite.

The rewrite is intentionally destructive at the architectural level: existing code is source material, not a compatibility obligation. Useful behavior, tests, fixtures, and prior design decisions are recovered selectively after being reconciled against the actual DeepSeek Harness (`dsh`).

## Product direction

DSH Stack is both:

1. a reusable extension ecosystem for DeepSeek Harness; and
2. a first-class, opinionated integrated agent environment.

The architecture therefore has two layers:

- reusable Stack capabilities and plugins;
- a canonical Stack product/profile that composes those capabilities into the intended environment.

The finished system should feel like one coherent product rather than a bag of plugins. Web and CLI are interfaces over the same underlying services/capabilities. Low-level behavior must use native DSH primitives when their semantics fit; additional Stack abstractions exist only when they add a real product/domain boundary.

## Architectural rule

Every proposed Stack abstraction is classified before implementation:

### DSH-native

Use the existing DSH primitive directly when it already expresses the required semantics.

### Stack adapter / orchestration

Wrap or compose a DSH primitive when the product needs richer domain semantics without replacing the underlying DSH contract.

### New Stack capability

Introduce a real Cordis service/event/provider seam only where DSH has no adequate primitive.

### Product composition

Use configuration/profile/bundle composition rather than introducing runtime abstractions when the requirement is only product assembly.

The rewrite must not recreate DSH's lifecycle, dependency resolver, session engine, agent preset mechanism, tool registry, or UI composition model without a demonstrated missing capability.

## Verified DSH baseline

The current `dsh-stack` submodule pins `deepseek-ai/deepseek-harness` at commit `47f943859bef60e4160492346772ded9b24f765a`.

Current upstream `master` is 854 commits ahead of that pin as of this audit. There are no formal GitHub releases to use as a stable version anchor, so a deliberate commit pin remains necessary.

DSH's current architecture is a Cordis plugin tree. Product subsystems are plugins, including model adapters, tools, session log, agent registry/loop, persistence and UI. Profiles and bundles compose the tree; profile/home/CLI patches can replace or insert rows. UI is also extension-oriented through slots and client package loading.

Important native primitives now relevant to Stack include:

- per-session agent presets composed as Cordis subtrees;
- agent-scoped registrations and host/agent plane separation;
- durable session-event logs and session persistence backends;
- persisted session headers and derived projections;
- agent lifecycle and scoped events;
- LLM/provider routing and per-request model configuration;
- capability seams for filesystem, subprocess, shell, sandbox, terminals, LSP, web, jobs, tools and related execution capabilities;
- authorization and credential records with a distinct authorization-flow seam;
- client shell/static-module/dynamic-package layering;
- experimental Agent Teams with durable roster, mailbox and task coordination;
- increasingly strong package/module/invariant/documentation verification gates.

## Current upstream deltas that affect the rewrite

The upstream changes between our pin and current master are not a routine API bump. They include major architecture work after the pinned revision, including:

- per-session agent preset composition rather than process-global agent composition;
- stronger agent scope/lifecycle and ownership contracts;
- model routing, model catalog and reasoning-effort semantics;
- provider-owned context sizing and compaction policy;
- credential records and authorization flows beyond simple environment-variable secrets;
- configuration-source ownership and separation of credentials from environment state;
- durable session preparation, bounded persistence batching and compressed session storage;
- GUI layering and RPC protocol changes;
- dynamic client package loading and explicit static/dynamic package boundaries;
- plugin-owned settings surfaces;
- durable session projections and client views;
- experimental Agent Teams;
- package regrouping and experimental package conventions;
- persistent PTY and expanded subprocess capabilities;
- additional code-runtime and LSP seams.

The rewrite must target a deliberately selected upstream commit after the full compatibility audit rather than blindly updating to `master`.

## Current dsh-stack truth

The current repository contains a substantial documentation/implementation mismatch.

### Documented architecture

`.agents/PLAN.md` currently describes a six-domain-pack / 56-atomic-plugin architecture under `plugins/{core,ux,agents,ai,integrations,vcs}` and marks large groups as `[complete]`.

`.agents/AGENTS.md` still describes an older flat `plugins/dsh-*` layout and still treats the old workflow as normative.

The existing PRD describes a sophisticated harness extension layer, including slot shadowing, profile patches, credential management, session modes, live personas, themes, quotas and sidebar replacement.

### Actual implementation quality

Representative current packages are substantially thinner than the documentation claims. For example:

- `plugin-manager` exposes a `PluginManifest` registry, but `resolveDAG()` returns insertion order instead of resolving dependency constraints.
- `vault-credentials` currently exposes an in-memory `Map`-backed account service despite the plan claiming encrypted vault, typed records, OAuth, TOTP, audit and import behavior.
- `personas` currently exposes an in-memory roster while the plan describes durable persona selection, preset composition, prompt folding, commands and client state.
- the package check files often assert existence/basic behavior rather than proving full DSH integration.

Therefore status labels such as `[complete]` are not accepted as implementation truth without verifying the actual source and integration evidence.

### Current repository structure

The physical tree is closer to the newer pack/atomic-plugin model than the older documentation in `AGENTS.md`, but the two generations coexist conceptually. This is architectural drift, not a reason to preserve both.

## Target architectural direction

The target system is derived from capabilities, ownership, state semantics and DSH composition rather than from the present package list.

Conceptually:

```text
DeepSeek Harness / Cordis
        |
        +-- DSH-native capabilities
        |
        +-- Stack reusable capabilities
        |      |
        |      +-- state / configuration
        |      +-- credentials / authorization
        |      +-- providers / accounts / models
        |      +-- agent & preset management
        |      +-- tools / actions
        |      +-- projects / repositories
        |      +-- execution / integrations
        |      +-- UI / workspace composition
        |
        +-- canonical Stack profile
               |
               +-- integrated product experience
```

Package boundaries will be re-derived from this architecture. The existing six packs and 56-package count are not constraints.

## State model

We will not create a generic Stack database merely to avoid learning DSH persistence.

The default separation is:

```text
DSH Session log
    = durable agent/conversation/execution facts

DSH session persistence/projections
    = session storage, recovery and derived views

Stack domain state
    = persistent Stack-owned configuration/domain objects

Specialized secure state
    = credentials and authentication material

Cordis runtime state
    = ephemeral service/lifecycle state
```

A Stack state capability may exist as a support layer for Stack-owned domain state, but it must provide a real domain boundary: typed records, migrations, concurrency semantics, atomicity, versioning and appropriate durability. It must not duplicate the DSH session model.

## Agent model

DSH's built-in agent preset is the canonical agent composition primitive.

Stack will build around it rather than create a parallel `StackAgent` abstraction. Agent functionality includes the full desired multi-agent feature set, subject to the native DSH mechanisms and any additional Stack coordination needed:

- many simultaneous agents;
- per-session preset composition;
- agent/persona catalogs;
- agent-specific tools and capabilities;
- model/provider selection and policy;
- background and persistent agents;
- delegation and subagents;
- team/peer coordination where appropriate;
- project/repository association;
- agent-specific lifecycle and state.

The current implementation that represents personas as plain records is considered legacy and will be replaced by native preset composition plus Stack-owned catalog/product management.

## Provider / model model

The provider system will be an orchestration layer around the DSH LLM seam, not a replacement for it.

Conceptual flow:

```text
product selection / policy
        |
     model id
        |
provider + account resolution
        |
credential / authorization
        |
DSH LLM adapter
        |
model request
```

This layer can own richer semantics such as:

- account management;
- model catalogs and aliases;
- routing;
- fallback;
- capability matching;
- context-window metadata;
- reasoning effort;
- availability;
- cost / latency policy;
- per-agent and per-project policy.

But actual model execution remains behind DSH's LLM seam.

## Credentials / authorization target

The credential subsystem is substantially broader than the current dsh-stack plan.

It should eventually support genuine records and flows for:

- API keys;
- OAuth access/refresh grants;
- provider accounts;
- passwords;
- usernames and account identity;
- TOTP/OTP secrets and generated codes;
- QR provisioning and otpauth material;
- recovery codes;
- passkeys/WebAuthn credentials;
- SSH keys;
- certificates/client credentials;
- cookies/session artifacts where explicitly justified;
- secret generation, rotation, expiration and revocation;
- audit and access policy;
- authorization flows with user interaction;
- safe reveal/disclosure controls;
- agent/tool access under explicit policy.

Credential metadata, account identity, secret material, authentication method and authorization grant must be separate concepts.

The native DSH credential and authorization seams are now substantially stronger and will be the baseline rather than reproducing the older Andromeda vault in isolation.

## Integration model

Integrations are capabilities/providers first and brand-specific adapters second.

Preferred conceptual boundaries:

```text
Execution
  - subprocess
  - shell
  - PTY
  - sandbox

Filesystem
  - local / remote / sandboxed backends

Source control
  - Git and other VCS implementations
  - forge/provider adapters such as GitHub/GitLab/Forgejo

Code intelligence
  - LSP
  - diagnostics
  - formatting
  - indexing/search

Network / services
  - HTTP and provider-specific API adapters
```

A product domain should consume these common capabilities instead of each integration inventing a private execution/auth/filesystem model.

## Web / UI model

The Stack web application remains an integrated workspace built on DSH's web composition and client package system.

The desired product surface includes, as applicable:

- projects/repositories;
- conversations and sessions;
- agents/personas;
- files/editor;
- terminals;
- tools/actions;
- model/provider/account management;
- credentials/authentication;
- settings;
- context/details panels;
- integrated workspace navigation.

UI ownership is determined by actual DSH slots, client package lifecycle, host/client boundaries and product requirements. DOM mutation and source patching of the harness are not acceptable substitutes for the proper extension seam.

## CLI model

Web and CLI are interfaces over the same Stack services/capabilities.

The CLI must not grow a second business-logic implementation simply because a feature has a command. Commands are owners/consumers of domain services and should produce stable machine-readable behavior where appropriate.

## Upstream compatibility policy

- `harness/` stays a pristine git submodule.
- Stack does not patch upstream source.
- The harness pin is deliberate and changed only as part of an audited upstream update.
- Upstream-breaking changes are expected because DSH remains developer-preview software.
- Before implementation begins, the chosen pin must be reconciled against current upstream architecture and relevant implemented notes.

## Rewrite method

### Phase 0 — truth audit

1. Inventory the complete current Stack tree.
2. Inventory current exports, services, events, commands, configuration and tests.
3. Read all normative Stack docs and classify their statements as current, stale, historical or aspirational.
4. Inventory the DSH primitives used by the Stack.
5. Compare the pinned DSH against current upstream.
6. Recover the intended feature set from PRD, PLAN, BACKLOG, request history and current behavior.
7. Produce a gap/contradiction matrix.

### Phase 1 — target architecture

1. Define product boundaries.
2. Define capabilities and ownership.
3. Define services and public APIs.
4. Define durable event/state ownership.
5. Define provider/adapter seams.
6. Define security/credential boundaries.
7. Define UI/client composition.
8. Derive package boundaries from the resulting dependency graph.
9. Define test/invariant requirements.

### Phase 2 — foundation reconstruction

Build a clean project foundation for:

- workspace/build;
- package contracts;
- profile/bundle composition;
- Stack configuration;
- Stack domain persistence where required;
- test harnesses and integration booting;
- documentation/invariant tooling.

### Phase 3 — core domain reconstruction

Implement in dependency order, with exact ordering finalized by the Phase 1 dependency graph:

1. configuration/domain state;
2. credentials + authorization;
3. provider/account/model layer;
4. agent/preset/catalog layer;
5. sessions and agent-facing state extensions;
6. tools/actions/commands;
7. project/repository/workspace model;
8. execution/integration capabilities.

### Phase 4 — integrated product UI

Rebuild the workspace UI around the actual DSH client architecture and the final product information architecture. Cross-domain state and actions must use the same domain services as CLI/headless composition.

### Phase 5 — integration breadth

Implement and verify the desired execution, source-control, code-intelligence, provider, authentication and environment integrations against the final capability model.

### Phase 6 — cross-domain workflows

Validate complete user journeys such as:

```text
select agent
  -> preset composition
  -> select model
  -> resolve provider/account
  -> resolve credential
  -> open/create session
  -> attach project/repository
  -> execute tools / terminal / editor / LSP
  -> persist authoritative state
  -> restart / resume
  -> recover identical semantics
```

### Phase 7 — hardening

Audit the complete system for:

- fake implementations;
- placeholder state;
- unnecessary wrappers;
- duplicated state;
- duplicated business logic;
- `any` and unsafe casts;
- lifecycle leaks;
- race conditions;
- incorrect teardown;
- insecure secret handling;
- UI hacks;
- stale documentation;
- weak tests that merely assert object existence.

### Phase 8 — documentation reconstruction

Rewrite the repository documentation around the implemented architecture. Historical session records remain history; they are not normative design documents.

### Phase 9 — release baseline

A clean clone must support reproducible install, build, typecheck, tests, profile boot, Web, CLI, persistence, restart/resume and integration verification without hidden manual setup.

## Completion standard

A feature is not considered complete merely because source files exist or a lightweight plugin check passes.

A mature feature should, as applicable, have:

- typed public contract;
- correct Cordis lifecycle;
- real DSH integration;
- unit/domain tests;
- composition/boot test;
- persistence/restart test when stateful;
- Web verification when user-facing;
- CLI/headless verification when exposed;
- failure-path and teardown tests;
- synchronized documentation.

## Immediate next work

1. Finish the repository-wide implementation inventory.
2. Build the current Stack feature inventory from PRD/PLAN/BACKLOG/history.
3. Build the DSH primitive map at the selected upstream baseline.
4. Produce the gap/contradiction matrix.
5. Draft the target package/service/event graph.
6. Present only genuine product/architecture decisions back to the user; execution details remain ours.
7. Begin the rewrite from a clean architectural foundation.
