# Session 30 Request — Monorepo Migration, Conversation 3-Dots Menu, Subagents Dock & Sidebar Polish

Date: 2026-08-20

## User Requirements
1. **Monorepo Migration**:
   - Fold entirety of `dsh-stack` plugins into a single unified GitHub repository (`dsh-stack`).
   - Keep `harness/` as the only submodule in `.gitmodules`.
   - Remove standalone plugin repositories on GitHub under `marius-patrik`.
2. **Conversation 3-Dots Menu & View Switcher**:
   - Add persistent 3-dots button (`...`) in `conversation.session.header.utilities`.
   - Add "Switch View" (toggle between Chat and Trajectory) to the 3-dots dropdown menu.
   - Add "Download Session Log" to the 3-dots dropdown menu.
   - Remove the tab buttons ("Chat", "Trajectory") from the header strip (`display: none !important`).
3. **Move Subagents Display Above Input Bar**:
   - Remove subagents from the top header (`conversation.session.header.actions`).
   - Mount a new **Subagents Dock** in `conversation.input.dock` directly above the input bar, styled with the exact same tip surface card, 12px radius, status counts, and collapsible item rows as **todos** and **goals**.
4. **Sidebar Navigation Polish**:
   - Remove the `/`, `~` (user), and `Projects` button bar from the sidebar navigation header.
   - Fix conversation row hover highlight on `.dsh-tree-sessionRow` and `.dsh-tree-subagentRow`.
   - Fix `node_modules` showing as a repo by excluding vendor/internal directories from `isRepo`.
   - Fold live terminals and running containers into the collapsible `Ungrouped` section.
5. **Model Picker & Settings Fixes**:
   - Pure CSS SVG mask for white wireframe cube icon on model picker button (zero DOM mutations).
   - Size `P.Modal` to 840×800px with clean React event dispatch.
   - Remove preset badge next to the session title.
