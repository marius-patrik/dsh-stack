import { spawnSync } from "node:child_process";
import { findListenerPid } from "./processes.js";

/** Tailscale addresses for the status URL, when the tailscale CLI exists. */
interface TailscaleInfo {
  ip: string;
  dns: string;
}

/** Best-effort Tailscale lookup; empty strings when tailscale is absent. */
function tailscaleInfo(): TailscaleInfo {
  const probe = spawnSync("tailscale", ["ip", "-4"], { encoding: "utf8" });
  if (probe.error !== undefined || probe.status !== 0) return { ip: "", dns: "" };
  const ip = (probe.stdout ?? "").trim();
  const status = spawnSync("tailscale", ["status", "--json"], { encoding: "utf8" });
  let dns = "";
  try {
    const parsed: unknown = JSON.parse(status.stdout ?? "");
    if (typeof parsed === "object" && parsed !== null && "Self" in parsed) {
      const self = (parsed as { Self?: { DNSName?: unknown } }).Self;
      if (typeof self?.DNSName === "string") dns = self.DNSName.replace(/\.$/, "");
    }
  } catch {
    /* unparsable status: no DNS name */
  }
  return { ip, dns };
}

/** Shape of the pluginInventory/list RPC response this reads. */
interface PluginInventoryEntry {
  entryId: string;
  moduleName: string;
  fiberPhase: string;
}

/**
 * Query the running server's plugin inventory over its Typert HTTP RPC.
 * Returns a summary line plus one line per failed plugin (up to five), or an
 * empty list when the server doesn't answer within three seconds.
 */
async function pluginHealth(port: number): Promise<string[]> {
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
      signal: AbortSignal.timeout(3000),
    });
    const body: unknown = await res.json();
    if (typeof body !== "object" || body === null || !("result" in body)) return [];
    const result = (body as { result?: { ok?: boolean; value?: { entries?: unknown } } }).result;
    if (result?.ok !== true || !Array.isArray(result.value?.entries)) return [];
    const entries = result.value.entries as PluginInventoryEntry[];
    const active = entries.filter((e) => e.fiberPhase === "active").length;
    const failed = entries.filter((e) => e.fiberPhase === "failed");
    const lines = [`  Plugins:       ${active}/${entries.length} active (${failed.length} failed)`];
    for (const f of failed.slice(0, 5)) {
      lines.push(`    ✗ Failed: ${f.entryId} (${f.moduleName})`);
    }
    return lines;
  } catch {
    return [];
  }
}

/**
 * Build the `dsh status` report for the server expected on `port`: running
 * state with PID and preferred URL (Tailscale DNS, then Tailscale IP, then
 * loopback), the log file location, and plugin health when reachable.
 */
export async function statusReport(port: number, logFile: string): Promise<string> {
  const pid = findListenerPid(port);
  if (pid === null) {
    return `○ dsh web server is not running (port ${port} is free)`;
  }
  const ts = tailscaleInfo();
  let url = `http://127.0.0.1:${port}`;
  if (ts.dns.length > 0) url = `http://${ts.dns}:${port}`;
  else if (ts.ip.length > 0) url = `http://${ts.ip}:${port}`;
  const lines = [
    `● dsh web server is running (PID: ${pid})`,
    `  Address: ${url}`,
    `  Logs:    ${logFile}`,
  ];
  lines.push(...(await pluginHealth(port)));
  return lines.join("\n");
}
