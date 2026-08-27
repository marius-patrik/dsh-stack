---
date: 2026-08-27
status: active
---

# File a proposal, never skip

When you stumble on something outside the current scope — a defect, a dead or
duplicated implementation, a missing capability, a rule the repository does not
yet enforce — file it as an issue before moving on. Never skip it, and never
leave it only in a session transcript or a commit message.

A finding that lives only in a chat log is lost the moment that session ends.
This has already cost real work: a request document with nine verbatim user
directives survived only inside a git stash for four days, and an agreed repo
rule was written into `AGENTS.md`, never committed, and vanished in a
restructure.

## How to apply

- **Something is broken or wrong** → file it, with the root cause if you found
  one and the evidence that proves it.
- **Something is missing or should exist** → file it as a proposal, stating what
  it would change and why it is worth doing.
- **It belongs to an issue that already exists** → comment there instead of
  opening a duplicate. Growing the issue count is not the goal; losing nothing
  is.
- **You cannot finish investigating** → file what you established and what you
  ruled out, so the next attempt starts from your evidence rather than from
  scratch.

Every issue carries an `area:*` and a `severity:*` label and lands on the
project board, per the issue, roadmap and dispatch policy.

Skipping is only correct when the thing is already tracked. "I noticed but did
not record it" is not an outcome this repository accepts.
