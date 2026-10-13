# Architecture

## Source ownership

`packages/<name>/` is the recursive source implementation and bundle graph, with one owner per feature. Nested native bundles and their implementation plugins share `packages/`. Stack has no profile-template root. Physical nesting records composition ownership; native DSH metadata remains the runtime authority.

## Runtime ownership

DeepSeek Harness owns all runtime composition, profile installation and activation, session lifecycle, host services, package version resolution, and UI slots. Stack ships compatible native plugins and ordinary `dsh.bundle.patch` layers. There is no Stack-owned `dsh` launcher.

## Bundle composition

Every native bundle has an ordinary `package.json` declaring `dsh.bundle.patch`; parent packages declare child bundles via local dependencies and `stack.compose`. The build generator resolves the dependency DAG, deduplicates shared children, checks for cycles and duplicate inserted rows, and emits each parent patch. DSH only sees standard native patches; no nested runtime interpretation is needed.

## Profile ownership

Only DeepSeek Harness defines, installs, persists, selects and activates profiles. Stack publishes one native bundle graph which DSH can consume in any compatible profile or surface. No profile templates or Stack profile UI/runtime are distributed.

## Distribution

The Stack root coordinates per-package semver and reproducible release artifacts but never owns installation. The native npm package manifest is authoritative. `.github/scripts/release.mjs` resolves `workspace:` dependencies to published exact versions and emits tarballs, an integrity inventory, and a complete release manifest. Publishing and updates remain with native DSH/npm operations.

## Quality gates

CI must validate formatting, build, typecheck, tests, unique package ownership, dependency closure, generated patches, release asset contents, clean external DSH installation, `--dump-config`, real browser UI, Headless smoke, and upgrade/removal without changing user profile state.
