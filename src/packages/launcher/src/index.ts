export { readTweaks } from "./tweaks.js";
export type { DshTweaks } from "./tweaks.js";
export { resolveHome, migrateHome } from "./home.js";
export {
  DEFAULT_PORT,
  parseBoundPort,
  parseGatewayPort,
  readProfilePort,
  resolvePort,
  startPortHint,
} from "./ports.js";
export { packageDir, findHarnessDir, harnessCli, verbBin, tsxAvailable } from "./paths.js";
export { route, parseLogsArgs, parseAttachArgs } from "./route.js";
export type { RoutePlan, RouteOptions } from "./route.js";
export { findListenerPid, stopServer, startServer } from "./processes.js";
export type { StartedServer } from "./processes.js";
export { statusReport } from "./status.js";
export { readLogTail, followLog } from "./logs.js";
export { fetchPluginInventory, parsePluginInventory } from "./plugin-inventory.js";
export type { PluginInventoryEntry } from "./plugin-inventory.js";
export { summarizePluginMetrics, formatPluginMetricsLine } from "./plugin-metrics.js";
export type { PluginMetrics } from "./plugin-metrics.js";
export { attachToServer } from "./attach.js";
export type { AttachOptions } from "./attach.js";
