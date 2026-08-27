import type { PluginInventoryEntry } from "./plugin-inventory.js";

/** Counts derived from a plugin inventory snapshot, plus the failed entries. */
export interface PluginMetrics {
  total: number;
  active: number;
  failed: PluginInventoryEntry[];
}

/**
 * Summarize a plugin inventory snapshot into the counts both `dsh status` and
 * the `dsh attach` metrics line report: total entries, entries whose fiber is
 * active, and the entries whose fiber failed.
 */
export function summarizePluginMetrics(entries: PluginInventoryEntry[]): PluginMetrics {
  return {
    total: entries.length,
    active: entries.filter((entry) => entry.fiberPhase === "active").length,
    failed: entries.filter((entry) => entry.fiberPhase === "failed"),
  };
}

/**
 * Render the one-line live metrics banner `dsh attach` prints on every poll.
 * A null snapshot means the server did not answer the inventory RPC, which is
 * reported rather than hidden — an unreachable server is the interesting case
 * while attached.
 */
export function formatPluginMetricsLine(metrics: PluginMetrics | null, at: Date): string {
  const clock = at.toTimeString().slice(0, 8);
  if (metrics === null) return `── ${clock} · plugins: server not answering ──`;
  return `── ${clock} · plugins: ${metrics.total} total · ${metrics.active} active · ${metrics.failed.length} failed ──`;
}
