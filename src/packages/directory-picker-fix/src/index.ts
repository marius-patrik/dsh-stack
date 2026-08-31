/**
 * Statically mounts the resolved directory-picker backend, replacing
 * harness's own `directory-picker` row (`@deepseek-ai/dsh-host-directory-picker-auto`,
 * disabled by this package's own `cordis.patch.yml`).
 *
 * The auto-chooser mounts its resolved backend as a *dynamic* Loader entry
 * (`ctx.loader.create()` called from inside its own `apply()`). Under a full
 * Stack-scale boot (250+ concurrently-initializing entries) that dynamic
 * mount can race a second resolution of the same entry: the `directoryPicker`
 * cordis service ends up provided twice -- once by a `browse` backend, then
 * again by a colliding `native` attempt -- and the whole profile fails to
 * boot with "service \"directoryPicker\" has been registered at
 * <BrowseDirectoryPicker>" (dsh-stack#188). Reproducing this needed the real
 * Stack composition: harness's own isolated `directory-picker-auto` test
 * suite (a bare webserver + chooser, no other entries) never hits it, and a
 * bare/no-Stack `dsh web` boot didn't either -- only a fresh boot with the
 * full `@dsh-stack/pack-bundle` layer present reproduced it, every time.
 *
 * This plugin sidesteps the dynamic Loader path entirely: it resolves the
 * same backend via harness's own exported {@link resolveDirectoryPickerBackend}
 * (so the native/browse choice stays exactly as adaptive as before -- this
 * does not hardcode one backend), then mounts it as a plain, eager
 * `ctx.plugin()` composition, the same way any other Stack plugin composes.
 * `harness/` is pinned and must not be modified directly, so this plugin is
 * dsh-stack's own composition-level lever, per the issue's own scope note.
 *
 * The client surface (`@deepseek-ai/dsh-client-ui-directory-picker-{native,browse}`)
 * is still mounted via `ctx.loader.create()`, matching the auto-chooser: it
 * is a pure client-UI package with no server-side `directoryPicker` service
 * registration of its own, so it carries none of the risk the backend does.
 * @module @dsh-stack/directory-picker-fix
 */

import type { Context } from "@deepseek-ai/cordis";
import type {} from "@deepseek-ai/cordis-plugin-loader";
import type {} from "@deepseek-ai/dsh-host-webserver";
import {
  BACKEND_PACKAGES,
  canExecute,
  hasLinuxChooserBinary,
  resolveDirectoryPickerBackend,
  SURFACE_PACKAGES,
} from "@deepseek-ai/dsh-host-directory-picker-auto";
import BrowseDirectoryPicker from "@deepseek-ai/dsh-host-directory-picker-browse";
import NativeDirectoryPicker from "@deepseek-ai/dsh-host-directory-picker-native";

export const name = "directory-picker-fix";
/** Required services: the effective bind host (`webServer`) and the entry tree the client surface mounts into (`loader`). */
export const inject = ["webServer", "loader"];

/**
 * Resolve the interaction from one boot-time sample, mount its backend as a
 * plain plugin, and mount its client surface as a Loader entry.
 * @param ctx - cordis context carrying the injected `webServer` and `loader`.
 */
export async function apply(ctx: Context): Promise<void> {
  const backend = resolveDirectoryPickerBackend({
    bindHost: ctx.webServer.host,
    platform: process.platform,
    env: process.env,
    linuxChooser: hasLinuxChooserBinary(process.env.PATH, canExecute),
  });
  ctx.plugin(backend === "native" ? NativeDirectoryPicker : BrowseDirectoryPicker);
  ctx.logger.info(
    `directory-picker-fix: mounted ${BACKEND_PACKAGES[backend]} statically (bindHost=${ctx.webServer.host})`,
  );
  await ctx.loader.create({ name: SURFACE_PACKAGES[backend] });
}
