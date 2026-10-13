# DSH Stack TUI profile

Native DSH terminal profile using **exactly the same** `@dsh-stack/stack` plugin composition as Web and Headless, plus Chimney's independently released [dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) presentation adapter.

The profile contains no alternative Stack aggregate, independent runtime or launcher. DSH owns resolution, updates, user profile state, and activation. Apply the user patch last.

## Install from published packages

```sh
dsh plugin --profile tui add @dsh-stack/stack
dsh plugin --profile tui add @deepseek-harness-tui/dsh-tui@0.14.0
dsh --profile tui
```

The TUI is published independently and its checkout is tracked at `plugins/dsh-tui` as a Git submodule. For source development only, initialize it and its nested `vendor/dsh-std` submodule with `git submodule update --init --recursive plugins/dsh-tui`. Do **not** add the external repository to Stack's Bun workspace: it uses its own pnpm release pipeline. The TUI adapter is activated only by its native profile entry; it is not duplicated in the Stack bundle.

**Compatibility:** pinned Chimney 0.14.0 targets DSH up to `0.2.0-rc.2`; do not activate this profile under later DSH versions without revalidating peer compatibility.

Users may override or disable optional components in their DSH profile patch, but the default Stack package composition is identical across all three profiles.
