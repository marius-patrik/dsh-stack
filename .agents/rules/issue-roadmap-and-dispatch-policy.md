# Issue, roadmap and dispatch policy

- Every actionable feature or defect has a GitHub issue with one implementation
  owner, user value or reproduced failure, dependencies and behavior-driven
  acceptance criteria. Deferred concepts are labeled `type:idea` and are
  not implementation authorization.
- Large changes use an epic plus independently verifiable child issues.
  Dependent work branches from the merged foundation, not unmerged PR chains.
- The repository's canonical project board is `marius-patrik` project 13;
  keep issue and PR statuses consistent through the repository hygiene sweep.
- Every pull request must refer to the issue or issues it addresses and
  contain the latest `main` tip. Merged feature branches are auto-deleted.
- UI changes require real native DSH browser interaction verification,
  not only build success or static rendering.
- Independent work may be dispatched across eligible models, with each
  execution scoped to one branch and one observable goal. Reviewers own
  architectural decisions and merge approval.
- Record newly discovered out-of-scope defects in a concrete issue; do not
  leave them as untracked transcript notes.
- Use #352 for the dependency order and approved execution gates.
