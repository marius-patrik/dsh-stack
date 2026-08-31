# Sidebar workspace pass

Status: implemented contract / UI integration pending

## Decisions

The canonical Stack sidebar has one navigation model.

1. Action buttons sit above the filesystem/workspace tree.
2. The filesystem section is labelled `Files`, not `Workspaces`.
3. Sections are `Pinned`, `Containers`, `Terminals`, `Host Root`, `Container`, `Global`,
   and `Archived`. Container sessions and terminal sessions are separate sections rather
   than one mixed `Active` section, and the bucket for sessions that belong to no
   workspace is named `Global`.
4. Host and container section icons use the muted/gray icon tone; ordinary actionable sections retain the normal icon tone.
5. Every filesystem row has a three-dot context menu with open, open-new-tab, reveal, copy-path, rename, duplicate and delete actions.
6. The profile selector sits immediately above Settings in the sidebar footer.
7. Settings contains a normal compact `Profiles` tab for profile configuration; Stack extends the existing DSH settings surface rather than replacing it.
8. A single sidebar preference controls the large New Conversation action. It is not duplicated for collapsed and expanded states.
9. A single sidebar branding preference controls logo visibility in both collapsed and expanded states; the active skin supplies the actual asset.
10. Skins are independent plugins. The initial skins are DeepSeek, Claude and Codex.

The sidebar options button is a view control: it carries the `Show files` toggle over the
file/workspace tree region and no bulk session action.

The final UI implementation must use the current DSH client/slot architecture and the canonical sidebar/tab service. The pure TypeScript contracts in `@dsh-stack/composition` and `sidebar-tree` are the source of truth for state and action semantics; they are not a substitute for the eventual client surface.
