# Session 71 Request: Optional Dependency System and Hermes Agent Harness Under tmux

## User Directives (Verbatim)
`/plan add an optional dependency type as well for example ollama can launch claude code hermess and so on but doesnt require them`

## Architectural Scope & Requirements
1. **First-Class Optional Dependencies Contract (`@stack/plugin-manager`)**:
   - Plugins declare:
     - `export const inject = ['requiredService1', ...]` (Hard requirements: blocking in DAG).
     - `export const optional = ['optionalService1', ...]` (Soft requirements: non-blocking, dynamic feature activation).
   - In `plugin-manager`:
     - Tracks soft dependency edges without blocking plugin activation.
     - `ctx.optional(service, callback)`: Executes `callback` when `service` is mounted, gracefully skipped if omitted.
2. **Hermes Agent Harness (`plugins/integrations/tmux-terminal/hermes-harness/`)**:
   - Dedicated Nous Hermes / OpenHermes agent CLI running in tmux.
3. **Ollama Optional Bridging**:
   - `ollama-cli` declares `optional: ['claude', 'hermes']`.
   - If present, Ollama can bridge and launch Claude Code / Hermes CLI harnesses directly from local models without hard-requiring them.
