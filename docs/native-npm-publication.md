# Native npm publication

The GitHub release contains immutable, versioned `.tgz` archives for every Stack plugin and bundle, with `component-assets.json`, `stack-release.json`, and `SHA256SUMS`.

`.github/workflows/publish-native-npm.yml` runs on published releases and supports manual dispatch (to recover or republish the *existing* release without rebuilding). It:

1. Downloads and verifies SHA-256 release bytes and the native package inventory.
2. Publishes exact archives in dependency-first order to `registry.npmjs.org`. Existing matching versions are verified and skipped; mismatches fail. Packages are never repacked during publication.
3. Installs Stack Web, Headless and Chimney TUI from the public registry into clean native DSH profiles, checks their composed patches, and exercises Web remove/reinstall.

**Bootstrap requirement:** An owner of npm's `@dsh-stack` scope must configure authentication. For first publication, configure the repository Actions secret `NPM_TOKEN` with npm publish permission and suitable 2FA bypass. Once each package exists, configure GitHub Actions as its trusted publisher in npm settings (owner `marius-patrik`, repository `dsh-stack`, workflow `publish-native-npm.yml`, `npm publish` permission). This workflow already requests `id-token: write`; OIDC allows retiring the long-lived token after setup. npm requires the publishing owner to configure trust; repository automation cannot grant itself npm ownership.

A failed publication remains recoverable: rerun **Publish native npm packages** with the existing release tag. The publisher compares each package's registry integrity against the archived npm pack integrity and skips previously published matching versions.

Native compatibility smoke uses DSH `0.2.0-rc.2`, the declared peer cohort of Chimney TUI `0.14.0`. Revalidate peers before advancing this pin. Publication is complete only when all packages are visible in the public npm registry and the clean install check is green. A successful GitHub release alone is insufficient.
