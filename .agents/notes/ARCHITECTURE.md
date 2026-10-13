# Architecture

## Source ownership

`plugins/<name>/` is the recursive source implementation and bundle graph, with one owner per feature. Nested native bundles and their implementation plugins share `plugins/`; `profiles/` remains the separate DSH profile-template root. Physical nesting records composition ownership; native DSH metadata remains the runtime authority.

## Runtime ownership

DeepSeek Harness owns all runtime composition, profile installation and activation, session lifecycle, host services, package version resolution, and UI slots. Stack ships compatible native plugins and ordinary `dsh.bundle.patch` layers. There is no Stack-owned `dsh` launcher.

## Bundle composition

Every native bundle has an ordinary `package.json` declaring `dsh.bundle.patch`; parent packages declare child bundles via local dependencies and `stack.compose`. The build generator resolves the dependency DAG, deduplicates shared children, checks for cycles and duplicate inserted rows, and emits each parent patch. DSH only sees standard native patches; no nested runtime interpretation is needed.

## Profiles

`profiles/web/`, `profiles/headless/`, and `profiles/tui/` are DSH `dsh.profile` template folders, not npm bundle packages. Every profile uses the **same** complete `@dsh-stack/stack` composition from `plugins/stack`; only the DSH surface and optional independently maintained TUI adapter differ. There is no second headless/TUI Stack aggregate. User-provided patches apply with native DSH precedence.

## External plugin sources

`plugins/DarkFactory` and `plugins/Cognition` track independent upstream repositories as Git submodules. Their pinned source revisions do not imply native Stack activation or publication; workspace discovery, package verification, formatting and native releases exclude them until an explicit integration. `plugins/dsh-tui` is similarly independent, activated through its published DSH TUI profile entry. The repository contains no `_migrate/` root.

## Distribution

The Stack root coordinates per-package semver and reproducible release artifacts but never owns installation. The native npm package manifest is authoritative. `scripts/release.mjs` resolves `workspace:` dependencies to published exact versions and emits tarballs, an integrity inventory, and a complete release manifest. Publishing and updates remain with native DSH/npm operations.

## Quality gates

CI must validate formatting, build, typecheck, tests, unique package ownership, dependency closure, generated patches, release asset contents, clean external DSH installation, `--dump-config`, real browser UI, Headless smoke, and upgrade/removal without changing user profile state.
