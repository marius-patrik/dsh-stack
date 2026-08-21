# Session 46: Settings "Icons" Tab with Full Custom Icon Catalog & Dynamic Mappings Manager

## Request
**User Prompt:**
> "add an icons tab to setttings that shows all custom icons and allows configuring the mapping"

## Tasks
1. **Register "Icons" Settings Section & Nav Icon**:
   - Register `settings.section` with ID `icons` and label `Icons` in `plugins/dsh-providers` and `plugins/dsh-tweaks`.
   - Add `IconsNavIcon` (Lucide `Sparkles` / `Palette` vector with `dsh-icon-animated`).
   - Group under "Personalization" / "Customization" in `SettingsPanel`.
2. **Build Comprehensive Icons Section UI (`IconsSection`)**:
   - **Icon Catalog Grid**:
     - Visual gallery of all animated Lucide icons (System, Developer, File Types, Agents & Modes, Cloud & Host, Actions & UI).
     - Search / filter input by keyword.
     - Click to inspect and quick-assign.
   - **Custom Mappings Manager**:
     - Mappings tables for:
       1. File Extensions (`.ts`, `.py`, `.sql`, `.rs`, `.md`, `.env`, etc.)
       2. Folders & Categories (`Applications`, `Library`, `System`, `Users`, `Projects`, `Archive`, `Hosts`, etc.)
       3. Applications (`Terminal.app`, `Finder.app`, `Docker.app`, `Xcode.app`, `VSCode.app`, etc.)
       4. Agent Presets (`Code`, `Planning`, `Reasoning`, `Execution`, `Review`, `Reflection`, `Orchestrator`, etc.)
     - Add new custom mapping dialog/inline form with icon selector.
     - Edit, delete, and reset to defaults actions.
   - **Persistence & Dynamic Integration**:
     - Persist into `localStorage` (`dsh_custom_icon_mappings`).
     - Real-time global event dispatching (`dsh:icon-mappings-changed`) so all sidebar tree items, file nodes, and app icons update dynamically.
