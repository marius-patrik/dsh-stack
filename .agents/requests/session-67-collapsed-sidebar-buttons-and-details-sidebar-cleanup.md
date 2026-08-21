# Session 67 Request: Collapsed Sidebar Button Parity, Swapped Consistency, and Details Dock Cleanup

## User Directives Verbatim
1. `are all over the place they should match uncollapsed sidebar buttons with icons and funcitons and match each other with styling white and sizes and so on buttons dont make sense when sidebars are swapped`
2. `collapsed sidebar buttons are all over the place they should match uncollapsed sidebar buttons with icons and funcitons and match each other with styling white and sizes and so on buttons dont make sense when sidebars are swapped`
3. `examine against dairectives reorient yourself work poer system rules reallign docs backfill digestion pipeline and work through system per rules to work through issues for real`
4. `there is some weird details sidebar why did yo uadd it`

## Required Actions
1. **Remove Unwanted Details Sidebar**:
   - Eliminate automatic opening of the empty secondary dock / details sidebar.
   - `detailsCol` / secondary sidebar must remain completely collapsed (0px width, 0px margin, zero visual interference) unless a user explicitly docks a tab into it.
2. **Harmonize Collapsed and Uncollapsed Sidebar Action Buttons**:
   - Match all collapsed sidebar rail buttons to uncollapsed sidebar buttons in:
     - **Icons & Functions**: Clean 1:1 mapping (Search -> Search input expand, New Item (+) -> Unified New Item menu, Active Sessions -> Terminals/Sandboxes viewer, Settings -> Settings dialog).
     - **Visual Styling & Sizes**: Consistent 34px uniform height/width, clean white text/icons (`--dsw-alias-label-primary`), uniform 8px/10px border radius, subtle hover backgrounds (`rgba(255,255,255,0.08)`), consistent 16px/17px Lucide icon stroke.
     - **No Duplicate New Buttons**: Single consolidated New Session / Item trigger.
3. **Fix Swapped Sidebar Button Semantics & Directions**:
   - Correct toggle icon and direction when swapped to the right side (panel collapse/expand arrows pointing toward the correct edge).
   - Ensure tooltips, dropdown menus, and popovers align toward the inside of the viewport (leftwards when sidebar is on right, rightwards when sidebar is on left).
