# formatters

DeepSeek Harness (`dsh`) plugin: per-extension formatter commands with a
model-facing `format` tool and optional auto-format-on-edit.

The harness web UI is read-only, so this plugin works through the seams the
agent uses to write: a `format` tool over per-extension formatter commands
(`prettier`, `black`, `gofmt`, ...) and, when enabled, automatic reformatting
after every successful `edit`/`write` via the `tools/post-execute` waterfall.
Formatters run through `ctx.subprocess` — never shell-interpreted.

## Settings

`formatters:` section of `settings.yaml`:

```yaml
formatters:
  autoFormatOnEdit: true
  formatters:
    ".ts": { argv: [npx, prettier, --write] }
    ".py": { argv: [black, -q] }
```

Changes apply on the next boot (mounts are boot-time, not hot-reloaded).

## CLI

```
dsh formatter list
dsh formatter add <ext> <command...>     e.g. dsh formatter add .ts npx prettier --write
dsh formatter remove <ext>
dsh formatter set-auto <on|off>
```

## Layout

- `src/settings.ts` — the `formatters` settings namespace, formatter schema,
  and `formatterFor` / `autoFormatEnabled` helpers.
- `src/format.ts` — the shared formatting runner (`formatFile`) and path helpers.
- `src/index.ts` — plugin: settings section, `format` tool, auto-format hook.
- `bin/formatter.mjs` — the `dsh formatter` CLI.
- `check-plugin.mjs` — boot-verify harness (`npm test`).
