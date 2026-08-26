import type { ServerResponse } from "node:http";

/** Send a JSON response with the no-store, JSON-charset headers every plugin web route wants. */
export function sendJsonResponse(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}
