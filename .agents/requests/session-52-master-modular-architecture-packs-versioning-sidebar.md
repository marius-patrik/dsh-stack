# Session 52 Request: Master Modular Plugin Architecture, Grounded Code Reorganization, Plugin Packs, GitHub PR Auto-Tagging & Strict Sidebar System

## User Directives (Verbatim)
1. `can plugins require other ones?`
2. `start versioning on github via auto tag on merge to main require every merge to main to go through a pr from an implementation branch`
3. `also can plugins bundle others? if not well want to plan a plugin for this functionality then well want to organize our code so that we have a plugin for every feature basically and make them work together by requirong what others they rely on inclduing version pinning and bundling them logically via plugin packs`
4. `for .apps and exes make the sidebar load the actual app icons`
5. `get rid of any other colors in the sidebar than gray white and blurple`
6. `the plugin mapping you gave isnt enough, translator is for ai you need to base it on actual code reorganization and cleanup`
7. `think about it harder`

## Architectural Scope
- Complete feature-by-feature decoupling of monolithic client/backend files into single-responsibility plugins.
- Explicit Cordis dependency inversion matrix (`inject: [...]`) and `peerDependencies` with version pinning.
- Hierarchical Plugin Packs layer (`plugins/packs/dsh-pack-*`).
- GitHub Actions workflows for PR enforcement, CI status checks, and automated SemVer tagging + GitHub Releases.
- Native OS application icon extraction backend (`sips` + `Info.plist`) and frontend `NativeAppIcon` component.
- Strict Gray + White + Blurple tri-color sidebar theme.
