# Native npm publication

## Production status

Stack's **91 public npm packages** were successfully published and verified using **tokenless GitHub Actions OIDC** with [release v0.24.6](https://github.com/marius-patrik/dsh-stack/releases/tag/v0.24.6). [Publication run #38135582481](https://github.com/marius-patrik/dsh-stack/actions/runs/38135582481) passed exact-byte registry verification for all 91 packages and clean native DSH Web, Headless, Chimney TUI, and Web remove/reinstall checks. The release contains 91 versioned `.tgz` archives plus `component-assets.json`, `stack-release.json`, `stack-release.sha256`, and `SHA256SUMS`.

Following the source relocation, [release v0.24.8](https://github.com/marius-patrik/dsh-stack/releases/tag/v0.24.8) published all 91 incremented native package versions successfully with the same tokenless OIDC trust. [Publication workflow #38439397058](https://github.com/marius-patrik/dsh-stack/actions/runs/38439397058) passed public-registry exact-byte verification and clean native DSH installation. The pre-release registry-collision gate was added after the v0.24.7 conflict; it passed for v0.24.8 before the release was created. The earlier v0.24.6 paragraph records the original trusted-publisher bootstrap, not the latest release.

The [publisher](../../.github/workflows/publish-native-npm.yml) **does not read `NPM_TOKEN`**. It requires npm CLI >= 11.5.1, GitHub-hosted runners, `id-token: write`, no `NODE_AUTH_TOKEN`, and the npm trusted-publisher relationship for each package. The published package metadata identifies `marius-patrik/dsh-stack` as the source repository.

The trusted publisher for each `@dsh-stack/*` package must be configured with:
- Provider: GitHub Actions
- Owner: `marius-patrik`
- Repository: `dsh-stack`
- Workflow filename: `publish-native-npm.yml`
- Environment: none
- Allowed action: **npm publish**

Do not add a `registry-url` input to `actions/setup-node` in this workflow: that action sets a placeholder `NODE_AUTH_TOKEN` which conflicts with the tokenless-authentication guard. The publication step explicitly selects `https://registry.npmjs.org/` without injecting a publishing credential.

## Relocation and immutable-version safeguard

The source-tree migration in PR #332 changed the native packages' published `repository.directory` metadata. GitHub Release `v0.24.7` packaged the 91 resulting tarballs, but [npm publication #38417325868](https://github.com/marius-patrik/dsh-stack/actions/runs/38417325868) correctly rejected `@dsh-stack/plugin-kit@0.1.1`: that version already existed on npm with different SHA-512 bytes. **A successful GitHub Release is not evidence that its npm packages were published.**

The subsequent fix bumps all 91 independently published package versions, synchronizes 78 legacy `stack.json` descriptors and `bun.lock`, and checks every release archive's existing npm version integrity *before* creating another GitHub Release. The preflight accepts an unpublished version or an identical archive; an existing version with different bytes aborts without creating a release. Publication retains the same check and independent native DSH installation verification. Never reuse a prior npm package version when its packed contents change.

## Unified native composition

The repository publishes **one** Stack aggregate, `@dsh-stack/stack`, shared across Web, Headless and TUI profiles. Chimney's TUI is a separate presentation adapter, not an alternate Stack graph. Release inventories contain **88** native packages.

## Publication process

The [release workflow](../../.github/workflows/release.yml) creates a versioned GitHub Release and explicitly dispatches `publish-native-npm.yml` because release events created by `GITHUB_TOKEN` do not propagate into another workflow. The publication job:

1. Downloads the existing immutable release assets and verifies `SHA256SUMS` plus the native package inventory.
2. Publishes `@dsh-stack/*` archives in dependency order with `npm publish` and GitHub OIDC. It never rebuilds or repacks the release archives.
3. Reads fresh public registry metadata for every package and compares each published SHA-512 integrity against the original `npm pack` integrity. A duplicate-version response is not accepted as proof of publication.
4. Installs Web, Headless, and Chimney TUI using public npm packages into clean native DSH profiles, verifies their configuration, and removes/reinstalls Web.

npm's scanning and public registry propagation may delay visibility after the publish API accepts an archive. Registry verification permits that delay and checks every package rather than trusting the publish response.

## Recovery

If the publisher fails, rerun **Publish native npm packages** with the *existing* release tag. Already published versions are skipped **only when exact integrity matches**. Conflicting versions fail rather than overwriting immutable npm releases.

When creating a **new** npm package, first bootstrap the new package with authenticated or staged publishing and create its package-specific GitHub trusted publisher. Existing `@dsh-stack/*` packages have their OIDC trust validated by v0.24.6; new configurations must complete an OIDC publication within **48 hours** to remain valid.

Native installation verification currently pins DSH `0.2.0-rc.2` for compatibility with Chimney TUI `0.14.0`; revalidate before changing these pins.

## npm owner security cleanup

The npm owner must **delete the unused GitHub Actions secret `NPM_TOKEN` and revoke the previously exposed bootstrap token** in npm account settings. After confirming the v0.24.6 OIDC release, restrict traditional token-based publishing for the 91 packages through npm package access settings. Token cleanup does **not** require a new release or workflow modification; tracked in [issue #326](https://github.com/marius-patrik/dsh-stack/issues/326).
