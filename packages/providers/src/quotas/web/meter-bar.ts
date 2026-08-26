/**
 * ANSI meter-bar formatting for the quotas dashboard: renders usage as a
 * colored block-character bar, e.g. `[████████░░░░] 67%`.
 * @module providers/quotas/web/meter-bar
 */

/** Render a usage bar for `used`/`limit`, colored green/yellow/red by fill ratio. */
export function meterBar(used: number, limit: number, width = 20): string {
  if (limit <= 0) return `[${"░".repeat(width)}] no limit`;
  const ratio = Math.min(1, Math.max(0, used / limit));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const pct = Math.round(ratio * 100);
  const color = ratio < 0.6 ? "\x1b[32m" : ratio < 0.85 ? "\x1b[33m" : "\x1b[31m";
  const reset = "\x1b[0m";
  return `${color}[${"█".repeat(filled)}${"░".repeat(empty)}]${reset} ${pct}%`;
}
