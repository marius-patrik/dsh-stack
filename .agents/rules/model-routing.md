# Model routing for repository automation

- Route independent tasks to configured, healthy DSH providers according to
  task complexity, known limits and explicitly granted credentials.
- Separate independent work into bounded reviewable units. Each unit carries
  its source branch, acceptance criteria and verification output.
- Handle rate limits and unavailable routes using supported DSH retry,
  rotation or explicit resumption; never silently change the task's scope.
- Keep authentication material out of repository files, logs and issue bodies.
- Review and verify every dispatched result before merge. A running agent
  does not authorize its own merge or bypass required checks.
