# Session 55 Request: Universal Plugins Engine (dsh-plugins), Decoupled VCS & Forge Drivers, Pluggable Icons & Full-System Packs

## User Directives (Verbatim)
1. `still not good enough are the bundling and so on features native or do we need to build them?`
2. `I dont see a plugins package`
3. `repos should be general and there should eb a git github gitlab sapling and so on plugins`
4. `think about it harder cover the full system every feature`

## Architectural Scope & Requirements
1. **Universal Plugin Engine (`dsh-plugins`)**:
   - Build a dedicated `dsh-plugins` package providing the `ctx.plugins` service.
   - Dynamic plugin registry, DAG dependency graph resolver, pack bundling engine, and Settings > Plugins management interface.
2. **Generalized Repository Core (`dsh-repos`) & Pluggable Drivers**:
   - `dsh-repos`: Generic VCS & Forge abstraction layer + Universal Repo Workbench UI.
   - VCS Drivers: `dsh-repos-git`, `dsh-repos-sapling`, `dsh-repos-jj`.
   - Forge Adapters: `dsh-repos-github`, `dsh-repos-gitlab` (consuming `dsh-credentials`).
3. **Pluggable Icons Engine (`dsh-icons`) & Icon Packs**:
   - `dsh-icons`: Registry, loader, native OS app icon extraction (`sips`), and Settings > Icons tab.
   - Icon Packs: `dsh-icons-lucide` (animated SVGs), `dsh-icons-material`, etc.
4. **Hierarchical Domain Packs (`plugins/packs/`)**:
   - `dsh-pack-core`, `dsh-pack-ux`, `dsh-pack-ai`, `dsh-pack-vcs`, `dsh-pack-integrations`, and umbrella `dsh-pack-all`.
5. **GitHub Versioning & CI/CD**:
   - PR-only workflow targeting `main`.
   - Automated SemVer tagging and GitHub Releases upon merge.
