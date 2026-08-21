# Session 56 Request: Complete Decoupled Feature Architecture (Sidebar, Tabs/Windows, Settings UI, Pluggable Repos, Universal Plugins)

## User Directives (Verbatim)
1. `the custom sidebar should also be separate and the tab / window system, setttings overhaul - you need to examine the actual features`
2. `still not good enough are the bundling and so on features native or do we need to build them? I dont see a plugins package`
3. `repos should be general and there should eb a git github gitlab sapling and so on plugins`
4. `icons should be separate for the icon mapping and loader and allow adding any icon pack via a pljugin that requires icons`

## Full-System Architectural Decoupling:
- **`dsh-sidebar`**: Dedicated 5-tier sidebar navigation & tree system.
- **`dsh-tabs`**: Dedicated multi-area tab bar, bottom panel dock, and window management system.
- **`dsh-settings-ui`**: Dedicated draggable/resizable settings modal & navigation category system.
- **`dsh-plugins`**: Dedicated universal plugin registry, dependency DAG engine, and pack bundler.
- **`dsh-icons`**: Dedicated icon resolution engine + pluggable icon packs (`dsh-icons-lucide`, etc.).
- **`dsh-repos`**: Dedicated universal VCS workbench core + drivers (`git`, `sapling`, `jj`) and forge adapters (`github`, `gitlab`).
- **`dsh-tmux` & `dsh-docker`**: Dedicated terminal and container sandbox plugins.
- **`dsh-editor`**: Dedicated Monaco editor file viewer/editor tab.
