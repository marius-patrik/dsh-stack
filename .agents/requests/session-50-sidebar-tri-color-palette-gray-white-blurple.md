# Session 50 Request: Enforce Strict Tri-Color Palette in Sidebar (Gray, White, Blurple)

## User Prompt (Verbatim)
`/plan get rid of any other colors in the sidebar than gray white and blurple`

## Core Requirements & Objectives
1. **Purge Non-Compliant Colors in Sidebar**:
   - Eliminate all green (#22c55e, rgba(34, 197, 94, ...)), yellow/amber (#f59e0b, #eab308, rgba(245, 158, 11, ...)), and cyan/sky-blue (#38bdf8, rgba(56, 189, 248, ...)) across the sidebar.
2. **Harmonize to Strict 3-Color Hierarchy**:
   - **Blurple** (#6366f1 / rgba(99, 102, 241, ...)): Active selections, pinned icons/badges, active processes dot/pills, repository/workspace icons, subagent counts, folder chat counts, and archived indicators.
   - **Gray** (#888 / var(--dsw-alias-label-secondary/tertiary)): Inactive folders, system/library/users icons, file glyphs, chevrons, timestamps, borders, empty state notes.
   - **White** (#fff / var(--dsw-alias-label-primary)): Primary labels, titles, row text.
