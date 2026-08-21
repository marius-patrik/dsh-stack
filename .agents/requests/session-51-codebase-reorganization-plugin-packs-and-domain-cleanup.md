# Session 51 Request: Grounded Code Reorganization, Clean Feature Plugins & Plugin Packs

## User Prompt (Verbatim)
`/plan the plugin mapping you gave isnt enough, translator is for ai you need to base it on actual code reorganization and cleanup`

## Core Requirements & Objectives
1. **Grounded Codebase Reorganization & Cleanup**:
   - De-bloat monolithic files (`dsh-providers/client.js` 7.8k lines, `dsh-tweaks/client.js` 3.2k lines) by moving feature implementations into their true owning plugins:
     - `dsh-repos`: Receives Git Repository Workbench tab and git status/diff handlers.
     - `dsh-agents`: Receives Subagents Dock (`conversation.input.dock`) and subagent coordination logic.
     - `dsh-tools`: Receives Terminals & Docker Containers management backend and bottom panel dock.
     - `dsh-themes`: Receives Icons Catalog, Custom Icon Mappings manager, and theme palettes.
     - `dsh-translator`: Anchored in the AI domain for multi-provider format translation (sessions, prompts, schemas, MCP skills between Claude, OpenAI, DeepSeek).
2. **Explicit Inter-Plugin Dependencies & Version Pinning**:
   - Document and declare service injection (`inject: [...]`) and `peerDependencies` across all plugins.
3. **Plugin Packs Layer (`plugins/packs/`)**:
   - Scaffold composite plugin packs (`dsh-pack-core`, `dsh-pack-ai`, `dsh-pack-dev`, `dsh-pack-ux`, `dsh-pack-all`) for modular composition and 1-line installation.
