# Session 66 Request: Swapped Sidebars CSS Grid Layout Fix

## User Directives
- `sidebar still broken when swapped`

## Core Defect & Solution
- **Root Cause**: The harness frame container (`[class*="frame"]`) uses CSS Grid with an inline `grid-template-columns: ${cols.sidebar}px minmax(0, 1fr) ${cols.details}px`. When `body.dsh-sidebars-swapped` was active, setting `order: 3` on `sidebarCol` placed it into the 3rd track (which was 0px wide when details were closed), crushing the sidebar to 0px/1px and breaking the center column.
- **Fix**:
  1. Overrode `[class*="frame"]` in `body.dsh-sidebars-swapped` to `grid-template-columns: var(--dsh-secondary-sidebar-width, 0px) minmax(0, 1fr) var(--dsh-sidebar-width, 240px) !important`.
  2. Placed `detailsCol` / `.dsh-right-sidebar-dock` into `grid-column: 1`, `centerCol` into `grid-column: 2`, and `sidebarCol` / `.dsh-tw-root` into `grid-column: 3`.
  3. Streamlined `getCenterBounds()` to read `centerEl.getBoundingClientRect()` directly, ensuring top header tabs, bottom panels, and occupants align pixel-perfect with `centerCol` in all layout permutations.
