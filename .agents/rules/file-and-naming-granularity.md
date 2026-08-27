---
date: 2026-08-27
status: active
---

# File and naming granularity

- Avoid monolith files: a source file should generally implement one function (one cohesive unit of behavior), not a grab-bag of unrelated helpers.
- Avoid generic file/module names like `utils`, `helpers`, or `misc`. A name must capture the specific nuance of what the file does, not a catch-all category.
