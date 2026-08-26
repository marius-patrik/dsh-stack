/**
 * Renders the `GET /quotas` HTML dashboard: a plain server-rendered table of
 * quota snapshots with a refresh-all button.
 * @module providers/quotas/web/dashboard-render
 */

import type { QuotaSnapshot } from "../index.js";
import { meterBar } from "./meter-bar.js";

/** Escape a string for safe interpolation into HTML text content. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render one `<tr>` for a quota snapshot. */
function renderRow(s: QuotaSnapshot): string {
  const meter =
    s.used !== undefined && s.limit !== undefined
      ? meterBar(s.used, s.limit)
      : s.status === "available"
        ? "available"
        : s.status === "error"
          ? `\x1b[31merror\x1b[0m`
          : "unknown";
  const remaining = s.remaining !== undefined ? String(s.remaining) : "-";
  const resets = s.resetsAt ? new Date(s.resetsAt).toLocaleTimeString() : "-";
  return `<tr>
      <td>${escapeHtml(s.provider)}</td>
      <td><span class="status-${s.status}">${s.status}</span></td>
      <td><code>${meter}</code></td>
      <td>${remaining}</td>
      <td>${resets}</td>
      <td>${escapeHtml(s.message ?? "")}</td>
    </tr>`;
}

/** Render the full `/quotas` HTML dashboard page for the given snapshots. */
export function renderDashboard(snapshots: readonly QuotaSnapshot[]): string {
  const rows = snapshots.map(renderRow).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>dsh quotas</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; padding: 2rem; background: #0d1117; color: #c9d1d9; }
  h1 { font-size: 1.5rem; margin-bottom: 1rem; }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 0.5rem 1rem; text-align: left; border-bottom: 1px solid #21262d; }
  th { color: #8b949e; font-weight: 600; }
  .status-available { color: #3fb950; }
  .status-unknown { color: #8b949e; }
  .status-error { color: #f85149; }
  code { font-family: monospace; }
  .refresh-btn { background: #21262d; color: #c9d1d9; border: 1px solid #30363d; padding: 0.4rem 1rem; cursor: pointer; border-radius: 6px; margin-top: 1rem; }
  .refresh-btn:hover { background: #30363d; }
</style>
</head>
<body>
  <h1>dsh quotas</h1>
  <table>
    <thead><tr><th>provider</th><th>status</th><th>usage</th><th>remaining</th><th>resets</th><th>message</th></tr></thead>
    <tbody>${rows.length > 0 ? rows : '<tr><td colspan="6" style="color:#8b949e">no quota data yet — providers will populate on first refresh</td></tr>'}</tbody>
  </table>
  <button class="refresh-btn" onclick="fetch('/quotas/api/refresh',{method:'POST'}).then(()=>location.reload())">refresh all</button>
</body>
</html>`;
}
