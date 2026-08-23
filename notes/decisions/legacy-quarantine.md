# Legacy implementation quarantine

Status: active during rewrite

The historical `plugins/` tree is migration/reference material only. It is excluded from the active pnpm workspace and must not be imported by canonical code.

The rule is:

- production implementation lives under `packages/*`;
- one canonical owner exists for every feature;
- feature plugins may consume support libraries, but may not copy their implementation;
- external integrations remain separate feature plugins;
- old implementations remain only until their behavior has been migrated and reviewed;
- after migration, their repository files are deleted or moved to an explicitly non-build archive.

This quarantine is necessary because the available GitHub Contents API cannot remove a large directory tree atomically. It is not an architectural endorsement of the legacy layout.
