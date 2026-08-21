# Session 43: Fix Trajectory Switch Back to Chat & Remove Redundant Button

## Request
**User Prompt:**
> "still cant switch back to chat from trajectory and you added a second button next to the 3 dots one"

## Tasks
1. **Remove the Redundant View Toggle Button Next to 3-Dots**:
   - In `SessionHeaderUtilities` (`plugins/dsh-tweaks/client.js`), remove `dsh-header-view-toggle-btn`.
   - Ensure only the single 3-dots `…` button is rendered in the header utilities.
   - Hide redundant native `sessionLogButton` so the header is completely clean.
2. **Reliable Trajectory <-> Chat Bidirectional View Switching**:
   - Detect the real active view by checking `[role="tab"][aria-selected="true"]` in the DOM or mounted views.
   - In 3-dots dropdown menu:
     - On Chat view: displays "Switch to Trajectory View" with branch icon.
     - On Trajectory view: displays "Switch to Chat View" with chat icon.
   - On click, accurately find and trigger the corresponding tab button in the DOM (`Chat` / `Trajectory`), switching views smoothly and reliably in both directions.
