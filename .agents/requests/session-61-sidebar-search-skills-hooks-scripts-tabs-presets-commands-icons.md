# Session 61: Sidebar Search, Send Button Setting, Tab Architecture, Customization Skills/Hooks/Scripts, Presets Renaming, Real Commands System, Universal Animated Icons, and Sidebar Status Dots

## User Directives

1. **Sidebar search option doesn't work**:
   - The toggle in settings should dynamically show and hide the search button in the sidebar.
2. **Send button visibility setting**:
   - Add a setting to disable/enable hiding the send button when it is not available/disabled.
3. **Strict tab-based architecture (no floating modals/overlays)**:
   - There should be no terminal or container floating modals/overlays — everything should be opened and rendered cleanly as tabs in the main workspace, bottom panel, or secondary sidebar.
4. **Customization settings (Skills, Hooks, Scripts)**:
   - Settings under Customization must include full interactive management sections for:
     - Skills (loaded skills list, trigger commands, descriptions, enable/disable)
     - Hooks (workflow & git hooks: pre-commit, commit-msg, pre-push, on-change status, test runs)
     - Scripts (scripts runner, launcher tools, bin utilities)
5. **Rename Modes to Presets**:
   - Rename all instances of "Modes" / "Default Mode" / "Agent Mode" to "Presets" / "Default Preset" / "Agent Preset" across UI and settings.
6. **Reimplement Commands to be Real Commands (not actions)**:
   - Command palette and slash commands should be a full command execution system with command definitions, argument autocomplete, execution handlers, and terminal output runner integration.
7. **Complete Universal Lucide Animated Icons Coverage**:
   - Ensure every single icon in the UI uses animated Lucide SVG glyphs with crisp micro-interactions and animations.
8. **Sidebar Terminals & Containers Status Dots**:
   - Replace verbose text badges ("LIVE", "RUNNING") with a clean minimal green dot indicator (`#3fb950`) for running/active status.
