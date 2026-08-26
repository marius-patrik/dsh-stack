/**
 * `tweak-drag-drop`: the image drag-drop settings surface — the
 * `tweaks-drag-drop` section (enable + max image bytes) consumed by the
 * client attachment seam. Split out of the bundled `tweaks` package.
 * @module tweak-drag-drop
 */

import type { Context } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";
import { installLiveSettingsSection } from "@dsh-stack/plugin-kit";

/** Namespace of the drag-drop section. */
export const NS_DRAG_DROP = settingsNamespace("tweaks-drag-drop");

/** Drag-drop knobs. */
interface DragDropConfig {
  /** Whether image drag-drop is enabled (wires the attachment seam). */
  enabled: boolean;
  /** Max image bytes accepted from drag-drop (mirrors the attachment seam). */
  maxImageBytes: number;
}

const DragDropSchema: z<DragDropConfig> = z.object({
  enabled: z.boolean().default(true),
  maxImageBytes: z
    .natural()
    .min(1)
    .default(8 * 1024 * 1024),
});

export const name = "tweak-drag-drop";
export const inject: string[] = [];

/** The drag-drop extension config: the drag-drop section itself. */
export type Config = DragDropConfig;

export const Config: z<Config> = DragDropSchema;

/** apply implementation. */
export function apply(ctx: Context, config: Config): void {
  const dragDrop: DragDropConfig = {
    enabled: config?.enabled ?? true,
    maxImageBytes: config?.maxImageBytes ?? 8 * 1024 * 1024,
  };
  installLiveSettingsSection(ctx, NS_DRAG_DROP, DragDropSchema, dragDrop, undefined, () => {});
}
