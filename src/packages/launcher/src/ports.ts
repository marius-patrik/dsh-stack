import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Fallback port when neither the profile patch nor the server log pins one. */
export const DEFAULT_PORT = 3080;

/**
 * Parse the port the web server actually bound from its own startup output.
 * `@dsh-stack/hosts` prints a `dsh gateway: http://127.0.0.1:<port>` line
 * naming the gateway/API port that external consumers (Tailscale serve, the
 * documented default) actually need; when present it always wins over the
 * harness's own `dsh web: http://<host>:<port>` line, which names the
 * web-asset port instead and has caused real confusion (dsh-stack#182).
 * When the log holds several of the same kind of line (across restarts) the
 * last one wins. Returns null when neither line is present.
 */
export function parseBoundPort(logText: string): number | null {
  let webPort: number | null = null;
  const gatewayPattern = /dsh gateway:\s*https?:\/\/[^\s:/]+:(\d+)/g;
  for (const match of logText.matchAll(gatewayPattern)) {
    const parsed = Number(match[1]);
    if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) webPort = parsed;
  }
  if (webPort !== null) return webPort;
  const legacyPattern = /dsh web:\s*https?:\/\/[^\s:/]+:(\d+)/g;
  for (const match of logText.matchAll(legacyPattern)) {
    const parsed = Number(match[1]);
    if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) webPort = parsed;
  }
  return webPort;
}

/**
 * Read the port pinned for the `webserver` plugin in a profile's
 * cordis.patch.yml (`<home>/profiles/<profile>/cordis.patch.yml`). Line-based
 * and tolerant: finds the `- id: webserver` entry and the first `port:` key
 * inside it. Returns null when the file, entry, or key is absent.
 */
export function readProfilePort(home: string, profile: string): number | null {
  let lines: string[];
  try {
    lines = readFileSync(join(home, "profiles", profile, "cordis.patch.yml"), "utf8").split("\n");
  } catch {
    return null;
  }
  let inEntry = false;
  for (const line of lines) {
    if (/^\s*-\s+id\s*:/.test(line)) {
      inEntry = /^\s*-\s+id\s*:\s*['"]?webserver['"]?\s*$/.test(line);
      continue;
    }
    if (!inEntry) continue;
    const match = line.match(/^\s+port\s*:\s*(\d+)\s*$/);
    if (match) {
      const parsed = Number(match[1]);
      if (Number.isInteger(parsed) && parsed > 0 && parsed < 65536) return parsed;
      return null;
    }
  }
  return null;
}

/**
 * Resolve the port the web server is expected on, for status/stop checks:
 * the profile patch is the current declarative config and wins; the last
 * bound port in the log covers servers started with a non-default port and no
 * patch; DEFAULT_PORT is the final fallback.
 */
export function resolvePort(home: string, profile: string, logFile: string): number {
  const patched = readProfilePort(home, profile);
  if (patched !== null) return patched;
  try {
    const fromLog = parseBoundPort(readFileSync(logFile, "utf8"));
    if (fromLog !== null) return fromLog;
  } catch {
    /* no log yet */
  }
  return DEFAULT_PORT;
}

/**
 * Resolve the port hint used when starting the server: the profile patch when
 * present, else the default. The log is deliberately not consulted — it may
 * hold a stale port from an older configuration. The actually bound port is
 * learned from the server's own startup line after spawn (see parseBoundPort).
 */
export function startPortHint(home: string, profile: string): number {
  return readProfilePort(home, profile) ?? DEFAULT_PORT;
}
