---
date: 2026-08-27
status: active
---

# Destructive actions are explicit and audited

An action that destroys running work or user state is invoked deliberately, is
distinguishable from the ordinary action next to it, and leaves a record that it
ran.

- **Closing is not destroying.** Closing a terminal or container tab detaches
  the view; the process keeps running and stays re-attachable. Killing it is a
  separate action, presented as destructive.
- **Destruction is never the cheapest gesture.** Close and `⌘W` are reflexive,
  high-frequency, and low-deliberation. Nothing irreversible may hang off them.
- **Every destructive server route logs before it acts** — what ran, against
  what target, and which caller asked.

## Why

A user closing tabs to tidy up shut down their running containers. There was no
confirmation, no undo, and — because the routes executing `docker stop`,
`docker rm` and `tmux kill-session` recorded nothing — no way afterwards to tell
an unintended caller from an unrelated coincidence. The bug could not be
diagnosed because the destructive path left no evidence it had been taken.

Separately, moving a tab between surfaces removed it from its source before any
destination had accepted it, destroying an open conversation when the
destination could not render it.

## How to apply

- A transfer commits only once a destination has taken ownership. Remove-then-
  broadcast-and-hope destroys state whenever the far side ignores the message.
- Do not offer an action the destination cannot honour.
- When adding a route that can remove, stop or kill something, add its audit
  line in the same change. The calling referer is usually the field that makes
  the record useful.

Related: [[no-silent-no-ops]], [[results-verified-in-live-ui]].
