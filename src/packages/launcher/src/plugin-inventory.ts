/** Shape of one plugin entry in a `pluginInventory/list` RPC response. */
export interface PluginInventoryEntry {
  entryId: string;
  moduleName: string;
  fiberPhase: string;
}

/**
 * Extract the plugin entries from a decoded `pluginInventory/list` response
 * body. Returns null when the body is not a successful inventory result, so
 * callers can distinguish "server answered with nothing usable" from an empty
 * inventory.
 */
export function parsePluginInventory(body: unknown): PluginInventoryEntry[] | null {
  if (typeof body !== "object" || body === null || !("result" in body)) return null;
  const result = (body as { result?: { ok?: boolean; value?: { entries?: unknown } } }).result;
  if (result?.ok !== true || !Array.isArray(result.value?.entries)) return null;
  return result.value.entries as PluginInventoryEntry[];
}

/**
 * Query the running server's plugin inventory over its Typert HTTP RPC on
 * `port`. Returns null when the server does not answer within `timeoutMs`
 * (three seconds by default) or answers with an unusable body.
 */
export async function fetchPluginInventory(
  port: number,
  timeoutMs = 3000,
): Promise<PluginInventoryEntry[] | null> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/api/pluginInventory/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "client-request",
        rpcId: "status",
        method: "pluginInventory/list",
        payload: { args: {} },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return parsePluginInventory(await res.json());
  } catch {
    return null;
  }
}
