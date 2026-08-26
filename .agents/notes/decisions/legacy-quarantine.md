# Legacy implementation quarantine

Status: retired

The historical package/agent implementation trees are no longer canonical. The repository's only active implementation root is `plugins/`.

The final architecture has one owner for each feature. Compatibility bridges, duplicate implementation trees, migration shims, legacy runtime paths, and parallel feature owners are not retained merely to preserve the previous layout.

Legacy source that has been migrated is removed from the repository rather than retained as a second buildable implementation. Reference material belongs in documentation, not in an executable implementation tree.
