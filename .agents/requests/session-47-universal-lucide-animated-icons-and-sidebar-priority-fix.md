# Session 47 Request: Universal Lucide Animated Icons Migration & Sidebar Restoration

## User Prompts (Verbatim)
1. `https://lucide-animated.com/ these?`
2. `still not all icons there are old ones from you so there must be code for it review everything same for the sidebar it regressed again`

## Requirements
1. **Universal Lucide Animated Icons**:
   - Reference: https://lucide-animated.com/
   - Ensure all icons across all plugins (dsh-actions, dsh-agents, dsh-credentials, dsh-themes, dsh-tweaks, dsh-providers) use genuine Lucide 24x24 SVG vectors with strokeWidth: 2, fill: "none", stroke: "currentColor", and the .dsh-icon-animated class.
   - Replace every remaining legacy @deepseek-ai/dsh-client-ui-primitives P.Icon... shape.
2. **Sidebar Structure**:
   - Ensure the unified 5-tier sidebar tree is unconditionally rendered:
     1. Pinned
     2. Active (Live chats, running tmux terminals, active Docker containers)
     3. Host Machine (Macintosh HD -> live filesystem tree with .app bundles, repositories, workspaces)
     4. Ungrouped
     5. Archived
   - Fix any regression that caused the sidebar to fallback to the harness default workspaces list.
