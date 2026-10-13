# @dsh-stack/directory-picker-fix

Replaces harness's `directory-picker` row (`@deepseek-ai/dsh-host-directory-picker-auto`)
with a statically-mounted equivalent, working around a loader-entry
double-registration that only reproduces under a full Stack-scale boot
(dsh-stack#188).

## Why

The auto-chooser mounts its resolved backend (`native` or `browse`) as a
*dynamic* Loader entry from inside its own `apply()`. Under the full
`the web profile` composition (250+ concurrently-initializing
entries), that dynamic mount can race a second resolution of the same entry:
the `directoryPicker` cordis service ends up provided twice, and the whole
profile fails to boot with:

```
Error: service "directoryPicker" has been registered at <BrowseDirectoryPicker>
```

DSH is installed independently; Stack must not modify the upstream harness. This package is
dsh-stack's own composition-level lever around the bug: its `apply()` mounts
the resolved backend as a plain, eager `ctx.plugin()` composition instead of
a dynamic Loader entry, reusing harness's own exported
`resolveDirectoryPickerBackend` so the native/browse choice stays exactly as
adaptive as before -- this does not hardcode one backend.

Disabling harness's own `directory-picker` row is what makes this take
effect, but that disable does not live in this package's own `cordis.patch.yml`
(it has none): only a profile's *top-level* `dsh.profile.bundles` layers have
their own patch read at boot, and no Stack profile lists this package there
directly -- it is only ever composed as a nested `insert` row inside
`the web profile`. The disable is instead emitted by
`packages/stack/composition/cordis.patch.yml` into the aggregated native
`@dsh-stack/stack` patch before the replacement row is inserted. The native
DSH Web profile reads this patch through `dsh.profile.bundles`.

## Usage

Composed automatically wherever `the web profile` is composed. No
configuration required.
