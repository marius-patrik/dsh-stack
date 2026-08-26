---
name: requests-readme
description: Convention for the requests/ folder — how raw user requests are captured and turned into issues.
---

# Requests

`.agents/requests/` is where verbatim user requests live before/alongside being scoped into GitHub issues. It is not a replacement for `.agents/notes/` (architecture/decision docs) — it is the raw input side. A request file is a durable record of *what was actually said*, so scoping work can be re-derived or audited later without depending on chat history.

## File format

Each file is YAML-frontmatter Markdown:

```markdown
---
date: 2026-08-26
session: <short session identifier or branch/worktree name>
issues: [52, 56]        # issue numbers this file's requests were scoped into, kept up to date
status: scoped           # raw | scoped | superseded
---

## <short label for a burst of related requests>

> exact verbatim quote of the user's message

> exact verbatim quote of a follow-up message in the same burst

### Semantic decomposition
- <bullet: one concrete ask extracted from the quotes above>
- <bullet: another concrete ask>
```

- One file does not have to correspond to one turn or one user message — bundle a coherent burst of related requests (e.g. everything the user said while a background task was running) into one file under one heading, as long as each quote is kept exact and separated (one blockquote per message).
- Multiple headings (multiple bursts) can live in the same file if they're related; start a new file when the topic changes meaningfully.
- Never paraphrase inside a quote block. Paraphrase only in the "Semantic decomposition" section below it.
- Update `issues:` and `status:` in the frontmatter once a request has been scoped into one or more GitHub issues — a request file is not "done" and discarded, it stays as the historical record the issue traces back to.

## Issue types this feeds

See `.agents/AGENTS.md`'s "Issue, roadmap, and dispatch policy" section for the full request → PRD → implementation-plan issue flow this folder is the input to.
