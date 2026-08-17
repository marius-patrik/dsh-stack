# BLOCKED — harness-seam ledger

> Written 2026-08-16 during the planning round that reoriented the stack toward the
> `dsh-tweaks` abstraction layer (see `PRD.md`). This ledger records every feature
> that needs to reach into the harness, the exact seam/anchors it touches, and the
> decision taken. `replaced` = handled by a dsh-tweaks occupant replacement (Option A,
> zero harness edits). `deferred` = real work, not scheduled, keep as open. No harness
> source edits and no DOM mutation are ever allowed; the ledger is the audit trail for
> that promise.

---

## Decision key

- **replaced** — the harness occupant/seat is swapped or shadowed by a `dsh-tweaks`
  replacement via profile patch rows (`disable + insert`); the feature lives in a
  plugin, harness untouched.
- **deferred** — the seam does not exist and cannot be synthesized by a replacement
  today; documented so it can be revisited without re-research.
- **unblocks** — a decision that removes a blocker (the feature is implementable the
  moment this is agreed).

---

## 1. Models → Keychain provider binding

- **Feature:** per-provider-row "Manage in Keychain" action; move raw key inputs out
  of the Models cards so provider config stores a credential **reference**.
- **Harness anchors:**
  - `packages/client/ui-settings-models/src/client/index.ts:118-124` — `models`
    section registration (no `children` declared, so no row-level seat exists).
  - `packages/client/ui-settings-models/src/client/ModelsSection.tsx` — `rowCard` /
    `rowActions` render (line ~314-379); no per-row slot.
  - `packages/client/ui-settings-general/src/client/SettingsRoot.tsx:91` —
    `renderSlot('settings.section', { close }, { only: active })`; `openSection(id)`
    exists (lines 113-116) but is passed only to onboarding steps, not to sections.
- **Missing seam:** a `settings.models.row` list slot (owner props
  `{ provider, displayName, credentialRef }`, rendered with `{ only: provider }` per
  row, mirroring `settings.plugins.tab:108`) plus `openSection` on
  `SettingsSectionOwnerProps`.
- **Decision: replaced.** dsh-tweaks' `TweaksSettingsRoot` declares
  `settings.models.row` and passes `openSection` to every section. dsh-credentials
  registers the action into the seam and deep-links via `/vault?ref=<REF>`.

---

## 2. Sidebar / workspace / history / machine-root batch

- **Feature:** (a) New Chat icon → clipboard-with-pen; (b) remove collapsed-rail
  search button; (c) hide add-workspace button when collapsed; (d) History section
  below Workspaces listing full history incl. non-workspace sessions; (e) no required
  workspace — machine-root default; (f) collapsible chevrons on Workspaces + History.
- **Harness anchors:**
  - `packages/client/ui-sidebar/src/client/SidebarRoot.tsx:161-169` — hardcoded
    `IconNewChatOutline16`, no slot/config seam.
  - `packages/client/ui-workspace/src/client/WorkspaceBrowser.tsx:1088-1104`
    (collapsed search, expands sidebar) and `1050-1067` (add-workspace button, not
    gated by `wide`) — inside the `sidebar.workspaces` occupant, no visibility/config
    seam.
  - `packages/client/ui-sidebar/src/client/contract/slots.ts:24,30,35` —
    `sidebar.workspaces` / `sidebar.settings` / `sidebar.footer.action`; **no**
    `sidebar.newSession` or `sidebar.history` slots exist.
  - No history-list component exists anywhere in `packages/client`; data is fully
    available via `useSessions` (host `session.list` returns machine-root sessions;
    "Ungrouped" bucket exists in `ui-workspace/src/client/tree.ts`).
  - Host already supports machine-root creation (`api-proxy.ts:2167-2180`,
    `workspaceId` optional → `defaults.cwd`); only the UI affordance is missing.
- **Decision: replaced.** dsh-tweaks `TweaksSidebarRoot` declares
  `sidebar.newSession` + `sidebar.history`; `TweaksWorkspaceBrowser` gates the
  collapsed controls; the History flow provides the machine-root affordance.

---

## 3. Live `persona/selected` push to clients

- **Feature:** input-bar persona badge updates when a persona switches.
- **Harness anchor:** `packages/api/remotes/src/remote-events.ts:17-29` —
  `API_REMOTE_FORWARDED_EVENTS` allowlist; adding `persona/selected` for verbatim
  client forwarding requires editing this harness-owned file.
- **Decision: unblocks (client folds).** No push. The client folds the active
  persona from `session.history` (the api-proxy history path carries the full event
  log + projections) and re-baselines on `connection/reset`. Live-correct, one frame
  behind the commit; acceptable for a badge. If a true push is ever wanted, revisit
  this row as a one-line harness edit.

---

## 4. Cross-store credential refresh (vault ↔ Models)

- **Feature:** vault `set`/`unset` on the Keychain page should invalidate the Models
  page (credential dot / availability), and vice-versa.
- **Harness anchors:**
  - `plugins/dsh-credentials/src/index.ts` — `ctx.accounts` vault writes emit no
    harness `credentials/updated` event today.
  - `packages/client/ui-settings-models/src/client/index.ts:100-116` — Models
    refetches on `credentials/updated` (already allowlisted).
- **Decision: deferred.** Next round: dsh-credentials emits its own vault-updated
  event on the host (or mirrors the harness event name) so the Models join can
  re-read. No harness edit needed for the emit; the Models page already listens.

---

## 5. Provider → credential-ref wire mapping

- **Feature:** per-provider "Manage in Keychain" deep-link to the right vault record,
  and a correct credential dot per provider.
- **Harness anchors:**
  - `packages/host/apiproxy/src/api/llm.ts:15-32` — `ConfigurableProviderView`
    carries no refs.
  - `plugins/dsh-providers/src/providers.ts:94-312` — the authoritative
    `PROVIDER_ROUTES` / `CredentialSlot` (slot/ref/cookieName) table lives
    host-side and is **not exposed to the browser**.
  - `ui-settings-models/src/client/store.ts` — `deriveKeyRef` produces
    `CLAUDE_SUB_API_KEY`-style refs that never match the canonical
    `CLAUDE_SUB_OAUTH_TOKEN` / cookie refs.
- **Decision: deferred (bridged).** The `settings.models.row` owner props carry
  `credentialRef` derived from the provider directory; a future `llm.providers` wire
  extension would expose the full `CredentialSlot` table. The `deriveKeyRef`
  mismatch is a known correctness gap to fix with the mapping.

---

## 6. `WEB_SETTINGS_NAMESPACES` gating

- **Feature:** browser-side reads of dsh-providers (and other plugin) settings
  namespaces from the Models page.
- **Harness anchor:** `packages/host/apiproxy/src/api-proxy.ts:126-128` — the web
  Settings API exposes only `['agent-loop','shell','locale','permission',
  'ui-conversation','ui-theme','web-search-deepseek']`; other namespaces answer
  `settings-not-exposed`.
- **Decision: deferred.** Keychain/Quotas use their own routes
  (`/vault/*`, `/quotas/api/*`), not the settings API; revisit only if a section
  needs direct namespace reads.

---

## 7. Settings nav glyph seam

- **Feature:** per-section nav icons (keychain, meter-bar, plug-in-socket).
- **Harness anchor:** `packages/client/ui-settings-general/src/client/SettingsRoot.tsx:22-28`
  — `navIcon(id)` hardcodes `models`/`agent-presets`/`plugins` and falls back to the
  gear; slot registration options carry no icon field (`ui-slots/src/index.ts`
  `KindOptions` list branch ~490-496).
- **Decision: replaced.** `TweaksSettingsRoot` owns the nav-rail render and a
  name→glyph map; plugins register a glyph by name into the `settings.section.icon`
  seat (list, `{ only: sectionId }`). Glyphs ship in each owning plugin's client
  bundle.

---

## 8. History section seat

- **Feature:** sidebar History section below Workspaces, collapsible.
- **Harness anchor:** no `sidebar.history` slot exists; `SidebarRoot` renders only
  `sidebar.workspaces` (region) and `sidebar.settings`/`sidebar.footer.action`
  (foot). Full session history incl. machine-root is already available via
  `useSessions`.
- **Decision: replaced.** `TweaksSidebarRoot` declares and renders `sidebar.history`
  between region and foot.
