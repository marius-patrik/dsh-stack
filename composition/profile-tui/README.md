# DSH Stack TUI profile

Native DSH terminal profile powered by Chimney's [dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) and Stack's headless composition.

The profile contains no independent runtime or launcher. DSH owns resolution, updates, profile state, and activation. Apply the user patch last.

## Install from published packages

```sh
dsh plugin --profile tui add @dsh-stack/stack-headless
dsh plugin --profile tui add @deepseek-harness-tui/dsh-tui@0.14.0
dsh --profile tui
```

The TUI is published independently and its checkout is tracked at `composition/profile-tui/dsh-tui` as a Git submodule. For source development only, initialize it and its nested `vendor/dsh-std` submodule with `git submodule update --init --recursive plugins/dsh-tui`. Do **not** add the external repository to Stack's Bun workspace: it uses its own pnpm release pipeline and native bundle metadata. The app's plugin patch is activated once by listing it as a profile bundle, **not** by inlining its patch into Stack's headless bundle.

**Compatibility:** the pinned Chimney 0.14.0 peer manifest targets DSH up to `0.2.0-rc.2`; do not activate this profile under later DSH versions until its maintainer publishes a compatible package. Never silently suppress DSH's version checks.

Users can override or disable optional components in their own DSH profile patch without modifying this template.
