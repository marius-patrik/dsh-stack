# Native npm publication

A GitHub release contains immutable, versioned `.tgz` archives for every Stack plugin and bundle, alongside `component-assets.json`, `stack-release.json`, and `SHA256SUMS`.

The `.github/workflows/publish-native-npm.yml` publisher runs for manually published releases and is explicitly dispatched by the release workflow because `GITHUB_TOKEN`-created releases do not propagate the `release` event. It also supports manual dispatch for an existing release. It:

1. Downloads release assets and validates SHA-256 checksums and the native inventory.
2. Publishes the original archives in dependency-first order to `registry.npmjs.org`, without rebuilding or repacking.
3. Verifies the exact SHA-512 npm pack integrity of **all** packages against public registry metadata. A duplicate-version response alone never counts as success.
4. Installs Stack Web, Headless, and Chimney TUI into clean native DSH profiles from the public registry, checks their composition, and exercises Web remove/reinstall.

### Initial publication

An npm owner must first create the `@dsh-stack` organization. Bootstrap publishing uses a short-lived granular npm token with permission to publish under `@dsh-stack` and appropriate 2FA bypass, installed as the GitHub Actions repository secret `NPM_TOKEN`. Keep the token out of the repository and logs. Revoke it after OIDC publishing has been validated.

Re-run **Publish native npm packages** with the existing release tag to resume. Existing versions with matching integrity are verified and skipped. The npm registry performs publish-time scanning before exposing newly published versions; an initial `npm publish` success or a subsequent duplicate-version error may precede public `npm view` visibility by 15 minutes or more. The publisher separates the write pass from the integrity-verification pass and allows for that delay.

### Migrate every package to GitHub Actions trusted publishing (OIDC)

When every package is visible, configure the trusted publisher for **each** npm package (there is no scope-wide trusted publisher). Use the GitHub repository `marius-patrik/dsh-stack`, workflow filename `publish-native-npm.yml`, no environment, and permission **Allow npm publish**. The workflow already requests `id-token: write` and uses GitHub-hosted runners and Node 24.

A package must exist first. Creating the trust connection requires an npm owner with interactive npm authentication and account 2FA: **a granular access token with bypass 2FA cannot authorize `npm trust`**. To avoid 91 manual browser forms, use npm CLI 11.15.0 or newer locally. Authenticate interactively and download the immutable package list for the release you just published:

```sh
npm login
tag=$(gh release view --repo marius-patrik/dsh-stack --json tagName --jq .tagName)
mkdir -p .release
gh release download "$tag" --repo marius-patrik/dsh-stack \
  --pattern stack-release.json --dir .release --clobber
node -e 'for (const pkg of require("./.release/stack-release.json").packages) console.log(pkg.name)' |
  while IFS= read -r package; do
    npm trust github "$package" \
      --repo marius-patrik/dsh-stack \
      --file publish-native-npm.yml --allow-publish --yes || exit 1
    sleep 2
  done
```

npm can offer a five-minute 2FA grace period during bulk configuration; another interactive verification may be required partway through. Inspect/reconcile existing trust connections if the loop stops on a package that has already been configured.

**Validation deadline:** New npm trusted-publisher configurations expire after **48 hours** unless they complete at least one successful OIDC publish. Therefore, do not enable trust until a new version of **every** package is prepared for prompt OIDC publishing; rerunning an existing release will skip identical published versions and will not validate the trust. The publication workflow must publish without `NODE_AUTH_TOKEN` for the OIDC validation run, and that run must pass the public registry integrity and native DSH installation gates. Only then remove `NPM_TOKEN` and, in npm package settings, select publishing access requiring 2FA and disallowing traditional tokens.

### Recovery and completion gates

Publication is complete only when every package is visible at its exact release integrity and clean DSH Web, Headless, and TUI registry installations pass. A successful GitHub release alone is not sufficient. The dependency-order script is restartable against the same release tag.

Native compatibility smoke currently uses DSH `0.2.0-rc.2`, the declared peer cohort of Chimney TUI `0.14.0`. Revalidate those peers before advancing this pin.
