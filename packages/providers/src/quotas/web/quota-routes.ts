/**
 * Core quota routes: the `GET /quotas` HTML dashboard, `GET
 * /quotas/api/integrations` (binary/usage probe), `GET /quotas/api/
 * snapshots`, `GET /quotas/api/summary`, and the refresh endpoints.
 * @module providers/quotas/web/quota-routes
 */

import { sendJsonResponse } from "@dsh-stack/plugin-kit";
import type { QuotaRegistry, QuotaSnapshot } from "../index.js";
import { probeBinariesAndUsage } from "./binary-probe.js";
import { renderDashboard } from "./dashboard-render.js";
import { QUOTAS_PREFIX } from "./quotas-prefix.js";
import { isRoute, type RouteContext } from "./route-context.js";

/** Handle one core quota request (dashboard, integrations, snapshots, summary, refresh). */
export async function handleQuotaRoute(
  ctx: RouteContext,
  registry: QuotaRegistry,
): Promise<boolean> {
  const { res, pathname, method } = ctx;

  if (isRoute(ctx, `${QUOTAS_PREFIX}/api/integrations`, "GET")) {
    sendJsonResponse(res, 200, probeBinariesAndUsage());
    return true;
  }

  if (isRoute(ctx, QUOTAS_PREFIX, "GET")) {
    const snapshots = registry.all();
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(renderDashboard(snapshots));
    return true;
  }

  if (isRoute(ctx, `${QUOTAS_PREFIX}/api/snapshots`, "GET")) {
    sendJsonResponse(res, 200, { snapshots: registry.all() });
    return true;
  }

  if (isRoute(ctx, `${QUOTAS_PREFIX}/api/summary`, "GET")) {
    const snapshots = registry.all();
    const summary = {
      total: snapshots.length,
      available: snapshots.filter((s) => s.status === "available").length,
      unknown: snapshots.filter((s) => s.status === "unknown").length,
      error: snapshots.filter((s) => s.status === "error").length,
      exhausted: snapshots.filter(
        (s) => s.status === "available" && s.remaining !== undefined && s.remaining <= 0,
      ).length,
      providers: snapshots.map((s: QuotaSnapshot) => ({
        provider: s.provider,
        status: s.status,
        remaining: s.remaining ?? null,
        limit: s.limit ?? null,
        resetsAt: s.resetsAt ?? null,
      })),
    };
    sendJsonResponse(res, 200, summary);
    return true;
  }

  const refreshPrefix = `${QUOTAS_PREFIX}/api/refresh/`;
  if (pathname.startsWith(refreshPrefix) && method === "POST") {
    const provider = decodeURIComponent(pathname.slice(refreshPrefix.length));
    const snapshot = await registry.refresh(provider);
    sendJsonResponse(res, 200, { snapshot });
    return true;
  }

  if (isRoute(ctx, `${QUOTAS_PREFIX}/api/refresh`, "POST")) {
    const snapshots: Array<{ provider: string; status: string; remaining?: number }> = [];
    for (const snap of registry.all()) {
      const refreshed = await registry.refresh(snap.provider);
      snapshots.push({
        provider: refreshed.provider,
        status: refreshed.status,
        remaining: refreshed.remaining,
      });
    }
    sendJsonResponse(res, 200, { snapshots });
    return true;
  }

  return false;
}
