# Native npm publication

## Ownership

Every publishable package beneath `packages/stack/` has an independent npm identity and native DSH contract. `@dsh-stack/stack` is the single aggregate for all compatible DSH surfaces. `packages/{DarkFactory,Cognition,dsh-tui}` are independent upstream source submodules and are not Stack npm packages. Stack never creates, configures or installs DSH profiles.

The release inventory and package count are derived from the checked-in manifests; never maintain a parallel hard-coded package count.

## Immutable release pipeline

The [release workflow](../../.github/workflows/release.yml) builds verified npm archives and publishes a versioned GitHub Release containing their checksums, `stack-release.json`, `stack-release.sha256`, `component-assets.json`, and `SHA256SUMS`.

Before publishing, verify that every target npm package version is either unpublished or already exists with exactly the same archive bytes. **Never publish changed contents under an existing npm version.** Reject conflicts before creating the release and retain the same integrity guard during publication.

The [publisher](../../.github/workflows/publish-native-npm.yml) explicitly downloads and validates the immutable release assets, publishes npm archives in dependency order, then independently compares each registry artifact's SHA-512 integrity with the packed release artifact. A successful publish request or a duplicate-version response is not proof of registry consistency. Permit registry propagation delay, but require the final exact-byte check for every package.

The release workflow explicitly dispatches publication. Releases created by `GITHUB_TOKEN` do not trigger another workflow's `release` event.

## Tokenless npm trust

Use GitHub Actions OIDC trusted publishing with GitHub-hosted runners, npm CLI >= 11.5.1, `id-token: write`, and no `NODE_AUTH_TOKEN` or `NPM_TOKEN`. Do not configure `registry-url` on `actions/setup-node` in the publisher: its injected token placeholder conflicts with tokenless publication.

Each `@dsh-stack/*` package's npm trusted publisher must match GitHub Actions, owner `marius-patrik`, repository `dsh-stack`, workflow `publish-native-npm.yml`, and no environment restrictions. New packages must have their trusted publisher configured and bootstrapped before the normal release sequence. Disable unnecessary traditional publishing tokens (security tracking: [#326](https://github.com/marius-patrik/dsh-stack/issues/326)).

## Native installation verification

Verify published packages by installing them through the independently distributed DSH CLI into fresh, isolated DSH-managed Web, Headless and TUI profiles, dumping the resolved configuration, testing real browser composition, and removing/reinstalling the Web bundle. Chimney's `@deepseek-harness-tui/dsh-tui` is installed independently by DSH, not bundled by Stack.

The integration matrix validates its declared DSH and Chimney TUI versions against fresh native installations. Update the matrix and compatibility fixtures together when a supported dependency changes. Tests use disposable DSH profiles and do not author or mutate profile templates in Stack.

## Recovery

Rerun **Publish native npm packages** against the same immutable GitHub Release tag. Already published versions are skipped only when their recorded integrity matches the release tarball; a differing archive fails closed. Do not rebuild, repack or silently substitute artifacts during recovery.
