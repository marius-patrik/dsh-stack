# Request: Session 29 — Fix Settings Button, Git Repo Detection & Icon, Sidebar Terminals/Containers Click Action

**Date:** 2026-08-20
**Source:** User prompt (/plan)

## User Directives

1. **Fix Settings Button**: Settings button in sidebar footer still does not open settings; diagnose root cause (how Cordis/Harness renders settings trigger vs custom component vs modal overlay) and make it 100% reliably work.
2. **Fix Git Repository Recognition**: Repo icon was showing on user folder (`/Users/user`) and not on actual git repos (`dsh-stack`, `projects/`, etc.). Fix backend repo detection (`.git` directory check) and frontend icon selection logic.
3. **Fix Sidebar Terminals & Containers Click Actions**: Clicking terminal sessions or container sandboxes in the sidebar didn't do anything; connect the click action directly to `BottomTerminalPanel` opening / tab activation in `GlobalTerminalAndContainerManager`.
