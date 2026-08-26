/**
 * Slim entry point re-assembling the quotas web surface from its
 * decomposed pieces: binary/usage probing, meter-bar/dashboard rendering,
 * and the per-domain route handlers (tmux, docker, filesystem, git,
 * sessions, core quota routes) dispatched in turn by `makeQuotaHandler`.
 * Public API (`QUOTAS_PREFIX`, `mountQuotaWeb`) is unchanged from the
 * previous single-file `web.ts`.
 * @module providers/quotas/web
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Context } from "@deepseek-ai/cordis";
import type {} from "@deepseek-ai/dsh-host-webserver";
import { sendJsonResponse } from "@dsh-stack/plugin-kit";
import type { QuotaRegistry } from "../index.js";
import { handleDockerRoute } from "./docker-routes.js";
import { handleFilesystemRoute } from "./filesystem-routes.js";
import { handleGitRoute } from "./git-routes.js";
import { handleQuotaRoute } from "./quota-routes.js";
import { QUOTAS_PREFIX } from "./quotas-prefix.js";
import type { RouteContext } from "./route-context.js";
import { handleSessionRoute } from "./session-routes.js";
import { handleTmuxRoute } from "./tmux-routes.js";

export { QUOTAS_PREFIX } from "./quotas-prefix.js";

/** Mount the `/quotas` prefix onto the harness webserver. */
export function mountQuotaWeb(ctx: Context, registry: QuotaRegistry): unknown {
  return ctx.inject(["webServer"], (httpCtx) =>
    httpCtx.webServer.register({
      kind: "prefix",
      path: QUOTAS_PREFIX,
      handler: makeQuotaHandler(registry),
    }),
  );
}

/** Build the request handler for everything under `/quotas`, dispatching to each domain in turn. */
function makeQuotaHandler(
  registry: QuotaRegistry,
): (req: IncomingMessage, res: ServerResponse) => void {
  return async (req, res) => {
    const url = new URL(req.url ?? "/", "http://quotas.local");
    const ctx: RouteContext = {
      req,
      res,
      url,
      pathname: url.pathname,
      method: req.method ?? "GET",
    };

    try {
      if (await handleQuotaRoute(ctx, registry)) return;
      if (await handleTmuxRoute(ctx)) return;
      if (await handleDockerRoute(ctx)) return;
      if (await handleFilesystemRoute(ctx)) return;
      if (await handleGitRoute(ctx)) return;
      if (await handleSessionRoute(ctx)) return;

      sendJsonResponse(res, 404, { error: "not found" });
    } catch (err) {
      sendJsonResponse(res, 500, { error: (err as Error).message });
    }
  };
}
