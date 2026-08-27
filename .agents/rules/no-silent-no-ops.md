---
date: 2026-08-27
status: active
---

# No silent no-ops

An action that cannot proceed says so. It does not return as though it
succeeded.

```js
// Wrong: indistinguishable from success, at every call site.
renameSession: (id, title) => {
  const session = ctx.sessions?.binding(id)?.session;
  return session ? session.rename(title) : Promise.resolve();
}
```

## Why

Every sidebar context-menu action was written this way. Rename, fork and archive
each resolved to nothing whenever the required service or session binding was
absent — and the harness contract is explicit that a binding is `undefined` "for
a session neither listed nor already scoped". So the menu worked on whichever
session happened to be scoped and silently did nothing on the rest, which is
both the reported bug and the reason it survived review: it looks like working
code and demos as working code.

A guard of the shape `x ? doThing() : Promise.resolve()` converts a missing
dependency into a lie about the outcome. The user gets no error, no feedback,
and no reason to report anything beyond "the buttons do nothing".

## How to apply

- Surface the failure: throw, reject, or return an explicit failure the caller
  renders. The user must be able to tell "nothing happened" from "it worked".
- `?.` and `??` are fine for reading optional data. They are not a substitute
  for handling an absent dependency in a mutating path.
- If an action is genuinely unavailable in the current state, disable or hide
  its control rather than presenting one that quietly does nothing.

Related: [[destructive-actions-are-explicit-and-audited]],
[[results-verified-in-live-ui]].
