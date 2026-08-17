# Request: Andromeda conversion, harness fix, repo restructure, state cleanup (Session 15)

> Source: This session (Aug 17 2026)
> Created: 2026-08-17

## What happened

Major infrastructure session: fixed the harness web server 400 error, restructured
the project into agents-super, cleaned up external provider state, converted all
andromeda session history into dsh format, and backfilled all request files.

## Tasks completed

### 1. Harness web server 400 error — RESOLVED
- Root cause: directory rename from ~/agents to ~/projects/dsh-stack broke all
  symlinks (profile node_modules, per-plugin peer deps)
- Fixed all 12 profile symlinks (dsh-* → new physical path)
- Fixed profile package.json (link: dependencies + 4 missing plugins)
- Ran pnpm install to regenerate pnpm symlinks
- Fixed 8 broken per-plugin node_modules/@deepseek-ai/ symlinks
- Added dsh-lsp, dsh-lsp-stdio, dsh-tool-lsp to flat fallback
- Created per-plugin node_modules/@deepseek-ai/ symlinks for all peer deps
- Verified: HTTP 200 at http://127.0.0.1:3080/

### 2. agents-super restructure (completed)
- ALL 16 dsh- plugin repos as submodules under dsh/
- privatecode moved to root (out of dsh/)
- paes + ams added under apps/ (private GitHub repos)
- README updated, committed + pushed (ca1cd09)

### 3. External state cleanup
- Deleted .dsh (stale), .gemini (155M), .grok (177M), .kimi (646M)
- All credentials already in dsh vault
- .claude kept (has opencode agent CLI)

### 4. Andromeda session conversion
- Converted ALL 405 andromeda transcripts into dsh .jsonl.zstd format
- Script: /tmp/convert-andromeda.mjs
- Output: ~/.agents/sessions/andromeda-*/session-andromeda-*.jsonl.zst
- 405 sessions converted, 0 skipped, 0 errors

### 5. Request file backfill
- Created 12 request files in .agents/requests/ covering all DSH session history
- Sources: CONTEXT.md sessions 1-14, Claude Desktop tasks (not DSH-related,
  skipped), andromeda transcripts (mostly DarkFactory reviews, converted but
  not individually backfilled)

## Status

Completed. All infrastructure work done.
