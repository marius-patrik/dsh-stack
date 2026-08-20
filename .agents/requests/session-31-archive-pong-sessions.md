# User Request: Archive Pong / Empty Sessions

- **Date**: 2026-08-20
- **Source**: User prompt
- **Raw Request**: `archive sessions that have pong only`

## Requirements
1. Archive all active sessions that have only "pong" / "ping" responses or are empty/blank test sessions (0 conversation turns).
2. Update `workspace.json` storage so these session IDs are moved to `archivedSessionIds`.
3. Provide a one-click **"Archive Empty/Pong Sessions"** action in the Ungrouped section header and folder actions menu.
4. Add CLI support via `dsh sessions --archive-pong` / `dsh sessions --archive-empty`.
