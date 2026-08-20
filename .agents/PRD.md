# PRD — settings, credentials, agents, and sidebar product scope

> Written 2026-08-16 during the planning round that reoriented the stack toward a
> **harness extension layer**. This is the product requirements document for the
> consolidated scope: the settings information architecture, Keychain, session
> modes, agents + live personas, themes catalogue, quotas dashboard, and the
> sidebar/workspace batch. It owns *what* and *why*; `PLAN.md` owns *when* (phases)
> and `BLOCKED.md` owns *what harness seam each feature needs*.

---

## 1. Product overview

One agent stack, everything a harness plugin. The harness checkout (`harness/`) is
the upstream source, pinned and kept **pristine** — no forks, no source edits. All
UI/behavior extension flows through a single abstraction owned by **`dsh-tweaks`**,
implemented with the harness's own endorsed composition mechanism (slot shadowing +
profile patch "disable + insert" rows). Every other plugin registers into seams that
dsh-tweaks declares; no plugin other than dsh-tweaks touches harness internals.

### 1.1 The abstraction layer (Option A)

How the web UI is modified without touching the harness:

1. **Slot shadowing by priority.** Any plugin may register into a root single slot
   at a lower `priority` and become the rendering winner (`ui-slots` "cell
   shadowing"; lowest priority renders). The `sidebar`, `sidebar.workspaces`, and
   `sidebar.settings` seats are all replaceable this way.
2. **Profile patch rows (disable + insert).** `profiles/web/cordis.patch.yml` and
   the bundle patch layer let a profile disable a harness entry and insert a
   replacement. This is the harness's own extension model — its web-app bundle does
   the same for entry swaps today.
3. **`children = declaration + authorization`.** A slot key has exactly one
   declarer. Taking over the `sidebar` occupant therefore requires the *disable +
   insert* path: disabling ui-sidebar's entry collapses its child declarations, and
   dsh-tweaks' inserted entry re-declares the whole subtree (`sidebar.workspaces`,
   `sidebar.settings`, `sidebar.footer.action`, plus new `sidebar.newSession` and
   `sidebar.history`) and registers `TweaksSidebarRoot`.

The three replaced shells:

| Harness occupant | dsh-tweaks replacement | Re-declared child slots |
|---|---|---|
| ui-sidebar `sidebar` | `TweaksSidebarRoot` | `sidebar.workspaces`, `sidebar.settings`, `sidebar.footer.action` + **`sidebar.newSession`**, **`sidebar.history`** |
| ui-workspace `sidebar.workspaces` | `TweaksWorkspaceBrowser` | `sidebar.workspaces.directoryFlow` + **collapsed-search / add-workspace / chevron config** |
| ui-settings-general `sidebar.settings` | `TweaksSettingsRoot` | `settings.trigger/header/action/close/section/onboarding` + **`settings.section.icon`**, **`settings.models.row`**, **`openSection` affordance** |

**Rules honored:** one declarer per slot; the four-share props contract
(`PropsRuntime` & `PropsRenderSlots` & `PropsStore` & inject face); JSON-compatible
data/callbacks across plugin boundaries (no ReactNode owner props); no DOM mutation;
no zod (schemastery everywhere).

**Other plugins use the seams, never the patch files:** dsh-credentials registers
the keychain glyph and the Models-row action; dsh-quotas registers the meter glyph;
dsh-agents registers the Agents section and persona switcher; dsh-session-modes
renames/labels its section; dsh-themes registers its catalogue tab + glyph.

### 1.2 The one backend exception

Pushing `persona/selected` *live* to browsers requires the harness-owned
`API_REMOTE_FORWARDED_EVENTS` allowlist (`packages/api/remotes/src/remote-events.ts`),
which no slot can reach. **Decision: the client folds persona state from
`session.history` instead** (the api-proxy history path carries the full event log
+ projections), so no harness backend edit is needed. Recorded in `BLOCKED.md`.

---

## 2. Settings information architecture

The Settings modal nav order, with icons. `General` stays harness-owned
(ui-settings-general); every other row registers through `settings.section` with an
`order` and — via the new `settings.section.icon` seat — a per-section glyph.

| # | Order | Section | Owner | Nav icon (glyph) |
|---|---|---|---|---|
| 1 | 0 | General | ui-settings-general (harness) | settings gear (unchanged) |
| 2 | 10 | Models | ui-settings-models (harness) | data (unchanged) |
| 3 | 15 | Quotas | `dsh-quotas` | **meter-bar** (dsh-quotas client bundle) |
| 4 | 20 | Session Modes | `dsh-session-modes` (label swap on `id:'agent-presets'`) | agent-preset glyph (unchanged) |
| 5 | 25 | Agents | `dsh-agents` | user/agent glyph |
| 6 | 30 | Themes | `dsh-themes` | light/dark glyph |
| 7 | 35 | Keychain | `dsh-credentials` | **keychain** (dsh-credentials client bundle) |
| 8 | 40 | Plugins | ui-settings-plugins (harness) | **plug-in-socket** (dsh-tweaks maps for `plugins`) |

Glyphs live in the owning plugin's client bundle and are registered by **name**
through the `settings.section.icon` seat; dsh-tweaks owns the name→glyph map so the
harness icon inventory is untouched.

---

## 3. Keychain (dsh-credentials web surface)

The credential manager's web surface is a Settings section named **Keychain** (not
a sidebar application page). Requirements:

- **Typed records** for all vault secret types: `api_key`, OAuth token, password,
  TOTP seed, passkey, cookie jar, recovery codes, SSH key, generic note — with
  purpose/account metadata, label, and expiry (`accounts()` returns
  `{ ref, account, kind, purpose, label, expiresAt }`).
- **Safe reveal** — `--reveal`-style fingerprint-first disclosure, no secret on
  argv, no material in logs.
- **Provider configuration stores a credential reference, not material.** Models
  cards hold a ref; raw key fields move out of the provider cards into Keychain.
- **Manage in Keychain** action per provider row (Phase D, via `settings.models.row`
  seat); deep-link to a specific credential via `src=/vault?ref=<REF>` + page-side
  filter.
- **Cross-store consistency:** a vault `set`/`unset` should invalidate the Models
  page and vice-versa. Deferred bridge: dsh-credentials emits its own
  vault-updated event (see `BLOCKED.md` #4).

---

## 4. Session Modes (dsh-session-modes)

Explicit per-session modes over the harness agent seams. Implemented and boot-verified;
this round adds the settings nav rename ("Session Modes") and icon.

- Mode set: `tool`, `search`, `action`, `plan`, `agent`, `shell`, `code`.
- Durable `session-mode/selected` event with pending acceptance at `agent/pre-step`;
  `/mode` command; mode-policy prompt section; executor allowlists at
  `tools/pre-execute`; per-mode routing at `agent/request`; bounded one-shot
  subagent assist.
- `plan` delegates planning to the native `ctx.planMode` seam.
- Modes are **independent of personas** (any persona × any mode).

---

## 5. Agents + live personas (dsh-agents)

Personas are decoupled from session modes and from base preset composition.

- **Catalog** remains the materialized persona files (MD/JSON) under the authoring
  root (existing `dsh-agents` pipeline).
- **Live switch = one durable `persona/selected` log event.** A `PersonaController`
  (WeakMap pending, fold-on-read via `findLast`) mirrors the shipped plan-mode /
  session-mode pattern: `set()` queues pending while an open turn exists, else
  commits immediately; `agent/pre-step` commits pending on accepted steps.
- **The session log is the hook.** `systemPrompt.section({ name: 'persona:policy',
  order: 45 })` uses a **function text provider that folds the log on every
  `assemble()`** — a committed `persona/selected` is visible to the model on the
  very next request. No mid-session re-render needed; resume/fork fold correctly
  because events never re-fire (seeded logs).
- **`/persona` command** (registered like `/mode`) drives `controller.set`.
- **Client switcher:** `commandUi.register` popupSelect (ported from ui-model-selection)
  + an active-persona badge in `conversation.input.left`; state refreshed by
  folding `session.history` (no live push — see 1.2). The badge also re-baselines on
  `connection/reset`.
- **Composition change:** stop text-splicing persona rows into generated presets
  (`dsh-agents/src/compose.ts`). The base composition mounts the persona package
  once; the `persona:policy` section resolves `personaId → prompt` from the runtime
  catalog. Switching never touches `presets.recompose` (blank-session-locked), so it
  works mid-conversation.
- **Default persona** renders when no `persona/selected` event exists (explicit
  fallback in the section).

---

## 6. Themes (dsh-themes)

- Catalogue tab in Settings (Open VSX search/install), apply via `ui-theme` seam.
  Already shipped as a plugin; this round adds the section registration order + icon.

---

## 7. Quotas (dsh-quotas)

- Provider-neutral quota/usage snapshot service + settings section (below Models).
- Read-only, cached with freshness timestamps; window/reset, used/remaining, and an
  explicit **unknown** state rather than invented numbers.
- Provider adapters are isolated and best-effort; CLI/subscription probes planned
  separately. Never logs credential material.
- This round: meter-bar nav icon (glyph in dsh-quotas client bundle).

---

## 8. Sidebar batch (dsh-tweaks-owned)

Via the replaced `TweaksSidebarRoot` / `TweaksWorkspaceBrowser`:

| # | Behavior | Seam | Status |
|---|---|---|---|
| a | New Chat icon → clipboard-with-pen | `sidebar.newSession` slot (owner `{ wide }`) | replaced |
| b | Remove search button from collapsed rail | tweaks-owned WorkspaceBrowser config (`railSearch: false`) | replaced |
| c | Hide add-workspace button when collapsed | tweaks-owned WorkspaceBrowser gate on `wide` | replaced |
| d | History section below Workspaces, full history incl. non-workspace | new `sidebar.history` slot; data via `useSessions` (host already returns machine-root sessions) | replaced |
| e | Don't require a workspace — machine-root default | host already supports it (`workspaceId` optional → `cwd` default); UI affordance in History flow | replaced |
| f | Collapsible chevrons on Workspaces and History | tweaks-owned section headers; per-group collapse already exists in ui-workspace stores | replaced |

---

## 9. Execution phases

| Phase | Scope | Owner | Verify |
|---|---|---|---|
| A | Abstraction foundation: Tweaks* occupant shells + profile patch rows (disable/insert), new slot declarations | dsh-tweaks | `check-plugin.mjs` + live web profile boot manifest |
| B | Icon abstraction: `settings.section.icon` seat + glyphs (keychain/meter/plug) → settings reorder + Session Modes rename + Agents/Themes tabs | dsh-tweaks + dsh-credentials + dsh-quotas + dsh-session-modes + dsh-agents + dsh-themes | live manifest + `/plugins/*/client.js` served |
| C | Live personas: `persona/selected`, PersonaController, `persona:policy`, `/persona`, input-bar switcher, client fold | dsh-agents | state-transition + fold + client badge tests |
| D | Keychain↔Models: `settings.models.row` seat + `openSection` + `/vault?ref=` deep-link | dsh-credentials | row action round-trip in live profile |
| E | Sidebar batch: History, machine-root, chevrons, collapsed toggles | dsh-tweaks | live profile render checks |
| F | Quotas data polish + icon | dsh-quotas | `/quotas/api/snapshots` + glyph |

Each phase ships its docs updates in the same commit (docs rule) and commits + pushes
the owning plugin repo before the superproject pin.

---

## 10. UI polish, unified tabs, and menus (Session 20)

Product requirements for composer alignment, shell tab unification, and OLED contrast:

1. **Input bar geometry**: Centered 34px circle plus button matching the send button, with vertically centered placeholder text in the composer card.
2. **Context menu parity**: The panel tab bar plus button and the collapsed sidebar rail plus button both open a unified context menu with options for `Conversation`, `Terminal`, and `Container`.
3. **Unified full-UI panel tabs**: Conversation window lives as a first-class view alongside interactive Terminals and Docker Sandboxes in the bottom panel tab strip, giving a unified multi-tab environment.
4. **Header declutter**: Preset badge removed from session header (available directly in the input bar toolbar) and session log download button hidden inside an overflow `...` menu.
5. **OLED theme contrast**: OLED dark mode uses true black `#000000`/`#050505` backgrounds with `#1a1a1a` borders across goal bars, badges, and panel elements.
