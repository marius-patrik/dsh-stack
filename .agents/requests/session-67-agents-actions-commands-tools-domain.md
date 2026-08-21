# Session 67 Request: Dedicated Agents Domain (Personas, Actions, Commands, Tools, Loops, Skills, Translator)

## User Directives (Verbatim)
`/plan I dont see agents actions commands tools and so on`

## Architectural Scope: The `plugins/agents/` Domain Pack
```
plugins/
  agents/                       (Cognitive Agent Systems Pack Plugin: @stack/pack-agents)
    personas/                   (Agent Personas, Roles Roster & Subagents Dock)
    actions/                    (Session Action Modes & Tool Execution Policies)
    commands/                   (Slash Commands Engine & Input Autocomplete)
    tools/                      (Universal Tool Registry & MCP Connectors: ctx.tools)
    loops/                      (Autonomous Goal Loops Engine: DarkFactory)
    skills/                     (Dynamic Agent Skill Loader: .agents/skills/)
    translator/                 (Cross-Provider Prompt, Session & MCP Skill Translator)
```
