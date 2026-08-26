/**
 * tweaks settings: the core `tweaks` namespace (homeRoot/command) that the
 * launcher reads. The v2 feature sections live in their dedicated tweak
 * extensions, each owning its own namespace and schema.
 * @module tweaks/settings
 */

import { settingsNamespace } from "@deepseek-ai/dsh-settings";

/** Namespace of the state-folder + command section. */
export const NS = settingsNamespace("tweaks");
