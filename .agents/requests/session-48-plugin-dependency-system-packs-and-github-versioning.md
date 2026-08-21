# Session 48 Request: Modular Plugin Dependency System, Plugin Packs & GitHub Versioning

## User Prompt (Verbatim)
`/plan can plugins require other ones? start versioning on github via auto tag on merge to main require every merge to main to go through a pr from an implementation branch, also can plugins budnel others? if not well want to plan a plugin for this functionality then well want to organize our code so that we have a plugin for every feature basically and make them work together by requirong what others they rely on inclduing version pinning and bundling them logically via plugin packs`

## Core Requirements & Objectives
1. **Plugin Dependencies & Inversion-of-Control**:
   - Clarify and standardize how plugins declare service dependencies via `inject: [...]`, slot dependencies via `ctx.slots.inject`, and package dependencies with version pinning in `package.json`.
2. **Plugin Bundling & Plugin Packs Architecture**:
   - Establish native Cordis composition patterns (`ctx.plugin(...)`) and pack manifests.
   - Plan modular single-feature plugins alongside logical plugin packs (`dsh-pack-core`, `dsh-pack-ai`, `dsh-pack-dev`, `dsh-pack-ux`, `dsh-pack-all`).
3. **GitHub Workflow, PR Requirement & Automated Version Tagging**:
   - Enforce PR-only workflow from implementation/feature branches to `main`.
   - Implement GitHub Actions workflow for automated SemVer tagging and GitHub Releases upon PR merge to `main`.
   - Implement PR CI workflow running pre-push validation and test suites.
