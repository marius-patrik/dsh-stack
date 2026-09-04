# Sidebar workspace pass

Status: partially implemented (see per-decision status below); remaining items tracked by #103.

## Decisions

The canonical Stack sidebar has one navigation model.

1. Action buttons sit above the filesystem/workspace tree. Pending (#103).
2. The filesystem section is labelled `Files`, not `Workspaces`, and sits below a
   restored native workspaces section. Pending (#103) -- the tree still renders one
   `Workspaces` header over the whole sidebar, not a separate `Files` section.
3. Sections are `Pinned`, `Containers`, `Terminals`, `Host Machine`, `Global`, and
   `Archived`. Container sessions and terminal sessions are separate sections rather
   than one mixed `Active` section, and the bucket for sessions that belong to no
   workspace is named `Global`. **Shipped** (#96, #97, #138): the sidebar tree, owned by
   `@dsh-stack/providers`'s `src/packages/providers/client/sidebar-tree/`, renders exactly
   this section list. A busy/running chat is not duplicated into a separate live list; it
   renders once in its normal group with a running indicator (see `tree-row.js`).
4. Host and container section icons use the muted/gray icon tone; ordinary actionable sections retain the normal icon tone. Partially shipped: Host Machine uses the muted tone; Containers/Terminals use the normal tone (they are actionable groups, not filesystem chrome).
5. Every filesystem row has a three-dot context menu with open, open-new-tab, reveal, copy-path, rename, duplicate and delete actions. Pending -- folder rows still only support expand/collapse, double-click-to-open-as-repo, and the "+" new-item menu; right-click sets state but nothing renders a menu from it (tracked as a follow-up, see the #138 PR description).
6. The profile selector sits immediately above Settings in the sidebar footer. Pending (#103).
7. Settings contains a normal compact `Profiles` tab for profile configuration; Stack extends the existing DSH settings surface rather than replacing it. Pending (#103).
8. A single sidebar preference controls the large New Conversation action. It is not duplicated for collapsed and expanded states. Shipped, predates this pass.
9. A single sidebar branding preference controls logo visibility in both collapsed and expanded states; the active skin supplies the actual asset. Shipped, predates this pass.
10. Skins are independent plugins. The initial skins are DeepSeek, Claude and Codex. Shipped, predates this pass.

The sidebar options button is a view control: it carries the `Show files` toggle over the
file/workspace tree region and no bulk session action.

**Layout preference (#103, shipped with #138):** `@dsh-stack/sidebar-preferences` also
persists `treeLayout` (`"sections"` | `"unified"`), user-editable from Settings > Sidebar.
`"sections"` is today's bordered, separated group blocks; `"unified"` renders the same
groups as one continuous tree with no dividers between them.

**Context-menu failures are surfaced, not swallowed (#98, shipped with #138):** the
`sidebar.workspaces` slot's injected `renameSession`/`archiveSession`/`forkSession`/
`createWorkspace` actions (`browserInjected` in `providers/client.js`) now reject with a
descriptive error instead of resolving when there is nothing to act on (e.g. no live
session binding). The sidebar tree's `session-action-dispatch.js` catches that rejection
and renders a dismissible notice (`tree-notice.js`) instead of leaving the click looking
inert.

The final UI implementation must use the current DSH client/slot architecture and the
canonical sidebar/tab service. `@dsh-stack/composition`'s `src/sidebar.ts` -- a section-list
contract nothing ever imported (#123) -- has been deleted as part of #138; the sidebar
tree in `providers/client/sidebar-tree/` is the single implementation owner and the source
of truth for section/row/action semantics going forward. There is no separate contract
package to keep in sync with it.
