# Session 54 Request: Pluggable Icons System, Dedicated Icon Packs & Full-System Feature Modularization

## User Prompt (Verbatim)
`/plan icons should be separate for the icon mapping and loader and allow adding any icon pack via a pljugin that requires icons --- think about it harder cover the full system every feature`

## Core Requirements & System Blueprint
1. **Dedicated Pluggable Icons Engine (`dsh-icons`)**:
   - `dsh-icons` provides the `ctx.icons` service and `window.__dsh_icons__` registry.
   - Supports pluggable icon packs: any icon pack is a plugin that declares `inject: ['icons']` (e.g. `dsh-icons-lucide`).
   - Dynamic icon resolution pipeline: Custom Mapping -> Native App Icon (`sips` extraction) -> Active Icon Pack -> Fallback.
   - Settings > Icons tab (Pack selector, Custom Mappings CRUD table, Icon Catalog).
2. **Full-System Feature-by-Feature Modularization (22 Single-Responsibility Plugins)**:
   - Security/Core: `dsh-credentials`, `dsh-tweaks`, `dsh-keybinds`.
   - Presentation: `dsh-icons`, `dsh-icons-lucide`, `dsh-themes`, `dsh-voice`, `dsh-tui`.
   - AI Engine: `dsh-dialects`, `dsh-providers`, `dsh-translator`, `dsh-agents`, `dsh-actions`, `dsh-loops`.
   - Integrations & Dev: `dsh-tmux`, `dsh-docker`, `dsh-repos`, `dsh-editor`, `dsh-tools`, `dsh-lsp`, `dsh-formatters`, `dsh-hosts`.
3. **Hierarchical Plugin Packs (`plugins/packs/`)**:
   - `dsh-pack-core`, `dsh-pack-ux`, `dsh-pack-ai`, `dsh-pack-integrations`, and umbrella `dsh-pack-all`.
4. **GitHub Versioning & CI/CD**:
   - PR-only workflow from feature branches to `main`.
   - Automated SemVer tagging and GitHub Releases upon merge to `main`.
5. **Sidebar Refinements**:
   - Native macOS `.app` icon extraction via `sips` in `dsh-icons` / fs API.
   - Strict tri-color palette: Gray, White, Blurple (#6366f1).
