/**
 * Tailscale CLI scanner and integration for hosts.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { NetworkNode } from "./types.js";

const execFileAsync = promisify(execFile);

interface TailscaleStatusJson {
  Self?: {
    ID?: string;
    PublicKey?: string;
    HostName?: string;
    DNSName?: string;
    TailscaleIPs?: string[];
    OS?: string;
    Online?: boolean;
  };
  Peer?: Record<
    string,
    {
      ID?: string;
      HostName?: string;
      DNSName?: string;
      TailscaleIPs?: string[];
      OS?: string;
      Online?: boolean;
      LastSeen?: string;
    }
  >;
}

/** normalizeOS implementation. */
function normalizeOS(osRaw?: string): NetworkNode["os"] {
  const os = (osRaw || "").toLowerCase();
  if (os.includes("mac") || os.includes("darwin")) return "macos";
  if (os.includes("win")) return "windows";
  if (os.includes("linux")) return "linux";
  if (os.includes("ios")) return "ios";
  if (os.includes("android")) return "android";
  return "other";
}

/** normalizeRole implementation. */
function normalizeRole(node: {
  isSelf: boolean;
  os: NetworkNode["os"];
  hostname: string;
}): NetworkNode["role"] {
  if (node.isSelf) return "coordinator";
  if (node.os === "ios" || node.os === "android") return "client";
  if (node.os === "windows" || node.os === "linux" || node.os === "macos") return "worker";
  return "peer";
}

/** scanTailscaleTopology implementation. */
export async function scanTailscaleTopology(): Promise<{
  self: NetworkNode | null;
  peers: NetworkNode[];
  active: boolean;
}> {
  try {
    const { stdout } = await execFileAsync("tailscale", ["status", "--json"], { timeout: 4000 });
    const data = JSON.parse(stdout) as TailscaleStatusJson;

    let selfNode: NetworkNode | null = null;
    if (data.Self) {
      const s = data.Self;
      const os = normalizeOS(s.OS);
      const dns = (s.DNSName || "").replace(/\.$/, "");
      selfNode = {
        id: s.ID || "self",
        name: s.HostName || "mac",
        hostname: s.HostName || "mac",
        dnsName: dns || undefined,
        ips: s.TailscaleIPs || [],
        os,
        online: true,
        isSelf: true,
        role: "coordinator",
        capabilities: ["web-server", "orchestration", "workspace-host", "storage-sync"],
      };
    }

    const peers: NetworkNode[] = [];
    for (const [key, p] of Object.entries(data.Peer || {})) {
      // Filter internal tailscale funnel ingress nodes
      if (p.HostName?.startsWith("funnel-ingress")) continue;

      const os = normalizeOS(p.OS);
      const hostname = p.HostName || key;
      const dns = (p.DNSName || "").replace(/\.$/, "");
      const isOnline = Boolean(p.Online);
      const role = normalizeRole({ isSelf: false, os, hostname });

      const capabilities: string[] = [];
      if (role === "worker") {
        capabilities.push("agent-runner", "inference-worker", "workspace-mirror");
      } else if (role === "client") {
        capabilities.push("web-client");
      }

      peers.push({
        id: p.ID || key,
        name: hostname,
        hostname,
        dnsName: dns || undefined,
        ips: p.TailscaleIPs || [],
        os,
        online: isOnline,
        isSelf: false,
        role,
        capabilities,
        lastSeen: p.LastSeen,
      });
    }

    return { self: selfNode, peers, active: true };
  } catch (_error) {
    return { self: null, peers: [], active: false };
  }
}
