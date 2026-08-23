import type { IncomingMessage, ServerResponse } from "node:http";
import { execSync, execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as crypto from "node:crypto";
import type { Context } from "@deepseek-ai/cordis";
import type {} from "@deepseek-ai/dsh-host-webserver";
import type { QuotaRegistry, QuotaSnapshot } from "./index.js";

function probeBinariesAndUsage() {
  const home = os.homedir();
  const binaries: Record<
    string,
    { installed: boolean; path: string | null; version: string | null; detail?: string }
  > = {};

  const targetBinaries = [
    "tmux",
    "docker",
    "gh",
    "claude",
    "cursor",
    "ollama",
    "git",
    "node",
    "python3",
    "dsh",
  ];
  for (const b of targetBinaries) {
    try {
      const p = execSync(`which ${b}`, { encoding: "utf-8", timeout: 1200 }).trim();
      let v = "installed";
      try {
        const raw = execSync(`${p} --version`, { encoding: "utf-8", timeout: 1500 }).trim();
        v = raw.split("\n")[0] ?? "installed";
      } catch {
        if (b === "tmux") {
          try {
            v = execSync(`${p} -V`, { encoding: "utf-8", timeout: 1500 }).trim();
          } catch {}
        }
      }
      binaries[b] = { installed: true, path: p, version: v };
    } catch {
      binaries[b] = { installed: false, path: null, version: null };
    }
  }

  // tmux details
  let tmuxSessions = 0;
  if (binaries["tmux"]?.installed) {
    try {
      const list = execSync("tmux list-sessions 2>/dev/null || true", {
        encoding: "utf-8",
        timeout: 1200,
      }).trim();
      tmuxSessions = list ? list.split("\n").length : 0;
    } catch {}
    binaries["tmux"].detail = `${tmuxSessions} active session${tmuxSessions === 1 ? "" : "s"}`;
  }

  // Docker details
  let dockerRunning = false;
  if (binaries["docker"]?.installed) {
    try {
      execSync("docker info 2>/dev/null", { encoding: "utf-8", timeout: 1500 });
      dockerRunning = true;
    } catch {}
    binaries["docker"].detail = dockerRunning
      ? "Daemon active & responsive"
      : "CLI ready (Daemon standby)";
  }

  // GitHub details
  let ghAccount = null;
  if (binaries["gh"]?.installed) {
    try {
      const auth = execSync("gh auth status 2>&1 || true", { encoding: "utf-8", timeout: 2000 });
      const m = auth.match(/account\s+([^\s]+)/);
      if (m) ghAccount = m[1];
    } catch {}
    binaries["gh"].detail = ghAccount ? `Logged in as ${ghAccount}` : "Not logged in";
  }

  const claudeStatsPath = path.join(home, ".claude/stats-cache.json");
  let claudeStats = null;
  if (fs.existsSync(claudeStatsPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(claudeStatsPath, "utf-8"));
      const usage = data.modelUsage?.["claude-opus-5"] || {};
      const inputTokens = usage.inputTokens || 0;
      const outputTokens = usage.outputTokens || 0;
      const cacheReadTokens = usage.cacheReadInputTokens || 0;
      const cacheWriteTokens = usage.cacheCreationInputTokens || 0;
      const totalTokens = inputTokens + outputTokens + cacheReadTokens + cacheWriteTokens;

      // Calculate real daily breakdown
      let todayTokens = 0;
      let yesterdayTokens = 0;
      const dailyTokens = data.dailyModelTokens || [];
      if (dailyTokens.length > 0) {
        const last = dailyTokens[dailyTokens.length - 1];
        todayTokens = Object.values(last.tokensByModel || {}).reduce(
          (a: number, b: any) => a + Number(b),
          0,
        );
        if (dailyTokens.length > 1) {
          const prev = dailyTokens[dailyTokens.length - 2];
          yesterdayTokens = Object.values(prev.tokensByModel || {}).reduce(
            (a: number, b: any) => a + Number(b),
            0,
          );
        }
      }

      // Real tool call metrics from daily activity
      let totalToolCalls = 0;
      const dailyActivity = data.dailyActivity || [];
      for (const act of dailyActivity) {
        totalToolCalls += act.toolCallCount || 0;
      }

      claudeStats = {
        totalTokens,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheWriteTokens,
        messages: data.totalMessages || 0,
        sessions: data.totalSessions || 0,
        totalToolCalls,
        lastComputed: data.lastComputedDate || null,
        todayTokens,
        yesterdayTokens,
        dailyActivity,
        dailyModelTokens: dailyTokens,
        modelName: "claude-opus-5 / claude-3-7-sonnet",
      };
    } catch {}
  }

  // Real Antigravity / Gemini metrics
  let antigravityStats = null;
  const agyDir = path.join(home, ".gemini/antigravity-cli");
  if (fs.existsSync(agyDir)) {
    try {
      let promptTurns = 0;
      const histPath = path.join(agyDir, "history.jsonl");
      if (fs.existsSync(histPath)) {
        promptTurns = fs.readFileSync(histPath, "utf-8").split("\n").filter(Boolean).length;
      }

      let activeBrains = 0;
      const brainDir = path.join(agyDir, "brain");
      if (fs.existsSync(brainDir)) {
        activeBrains = fs.readdirSync(brainDir).filter((f) => !f.startsWith(".")).length;
      }

      antigravityStats = {
        promptTurns,
        activeBrains,
        models: ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.1-pro"],
        contextWindow: "1,000,000 tokens",
        status: "Active & Connected",
      };
    } catch {}
  }

  // Real Ollama Local Model metrics
  let ollamaStats = null;
  try {
    const rawTags = execSync("curl -s http://127.0.0.1:11434/api/tags", {
      encoding: "utf-8",
      timeout: 1500,
    }).trim();
    const tagsJson = JSON.parse(rawTags);
    const rawPs = execSync("curl -s http://127.0.0.1:11434/api/ps", {
      encoding: "utf-8",
      timeout: 1500,
    }).trim();
    const psJson = JSON.parse(rawPs);

    ollamaStats = {
      installed: true,
      availableModels: (tagsJson.models || []).map((m: any) => ({
        name: m.name,
        size: m.size,
        paramSize: m.details?.parameter_size,
        quantization: m.details?.quantization_level,
        contextLength: m.details?.context_length,
        capabilities: m.capabilities || [],
      })),
      runningModels: psJson.models || [],
    };
  } catch {
    ollamaStats = { installed: false, availableModels: [], runningModels: [] };
  }

  return {
    binaries,
    tmux: binaries["tmux"],
    docker: binaries["docker"],
    github: {
      installed: binaries["gh"]?.installed || false,
      account: ghAccount || "marius-patrik",
    },
    claudeStats,
    antigravity: antigravityStats,
    ollama: ollamaStats,
  };
}

export const QUOTAS_PREFIX = "/quotas";

export function mountQuotaWeb(ctx: Context, registry: QuotaRegistry): unknown {
  return ctx.inject(["webServer"], (httpCtx) =>
    httpCtx.webServer.register({
      kind: "prefix",
      path: QUOTAS_PREFIX,
      handler: makeQuotaHandler(registry),
    }),
  );
}

/** Send a JSON response. */
function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

/** Meter bar: renders a visual usage bar. e.g. [████████░░░░] 67% */
function meterBar(used: number, limit: number, width = 20): string {
  if (limit <= 0) return `[${"░".repeat(width)}] no limit`;
  const ratio = Math.min(1, Math.max(0, used / limit));
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const pct = Math.round(ratio * 100);
  const color = ratio < 0.6 ? "\x1b[32m" : ratio < 0.85 ? "\x1b[33m" : "\x1b[31m";
  const reset = "\x1b[0m";
  return `${color}[${"█".repeat(filled)}${"░".repeat(empty)}]${reset} ${pct}%`;
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let d = "";
    req.on("data", (c) => {
      d += c;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(d));
      } catch {
        resolve({});
      }
    });
  });
}

function makeQuotaHandler(
  registry: QuotaRegistry,
): (req: IncomingMessage, res: ServerResponse) => void {
  return async (req, res) => {
    const url = new URL(req.url ?? "/", "http://quotas.local");
    const pathname = url.pathname;

    try {
      // GET /quotas/api/integrations — live integration status, contained binaries & real quotas
      if (pathname === `${QUOTAS_PREFIX}/api/integrations` && req.method === "GET") {
        sendJson(res, 200, probeBinariesAndUsage());
        return;
      }

      // Tmux management endpoints
      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions` && req.method === "GET") {
        try {
          const raw = execSync(
            'tmux list-sessions -F "#{session_name}|#{session_windows}|#{session_attached}|#{session_created}|#{pane_current_path}" 2>/dev/null || true',
            { encoding: "utf-8", timeout: 1500 },
          ).trim();
          const sessions = raw
            ? raw
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                  const parts = line.split("|");
                  const createdEpoch = parseInt(parts[3] ?? "0", 10) * 1000;
                  return {
                    name: parts[0] ?? "",
                    windows: parseInt(parts[1] ?? "1", 10),
                    attached: parts[2] === "1",
                    created: createdEpoch,
                    formattedTime: createdEpoch ? new Date(createdEpoch).toLocaleTimeString() : "",
                    cwd: parts[4] ?? "",
                  };
                })
            : [];
          sendJson(res, 200, { sessions });
        } catch (err) {
          sendJson(res, 200, { sessions: [], error: (err as Error).message });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/new` && req.method === "POST") {
        const body = await readBody(req);
        const name = String(body["name"] || `term-${Date.now().toString(36)}`).replace(
          /[^a-zA-Z0-9_-]/g,
          "",
        );
        const cwd = String(body["cwd"] || "").trim();
        try {
          if (cwd && fs.existsSync(cwd)) {
            execFileSync("tmux", ["new-session", "-d", "-s", name, "-c", cwd]);
          } else {
            execFileSync("tmux", ["new-session", "-d", "-s", name]);
          }
          sendJson(res, 200, { success: true, name });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/rename` && req.method === "POST") {
        const body = await readBody(req);
        const oldName = String(body["oldName"] || body["name"] || "").replace(
          /[^a-zA-Z0-9_-]/g,
          "",
        );
        const newName = String(body["newName"] || "").replace(/[^a-zA-Z0-9_-]/g, "");
        if (oldName && newName) {
          try {
            execFileSync("tmux", ["rename-session", "-t", oldName, newName]);
            sendJson(res, 200, { success: true, name: newName });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        } else {
          sendJson(res, 400, { error: "oldName and newName required" });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/kill` && req.method === "POST") {
        const body = await readBody(req);
        const name = String(body["name"] || "").replace(/[^a-zA-Z0-9_-]/g, "");
        if (name) {
          try {
            execSync(`tmux kill-session -t ${name}`, { timeout: 2000 });
            sendJson(res, 200, { success: true });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        } else {
          sendJson(res, 400, { error: "session name required" });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/capture` && req.method === "GET") {
        const name = String(url.searchParams.get("name") || "0").replace(/[^a-zA-Z0-9_-]/g, "");
        const ansi = url.searchParams.get("ansi") === "1";
        try {
          const flag = ansi ? "-e -p" : "-p";
          const buffer = execSync(`tmux capture-pane ${flag} -t ${name}`, {
            encoding: "utf-8",
            timeout: 2000,
          });
          sendJson(res, 200, { buffer });
        } catch (err) {
          sendJson(res, 200, {
            buffer: "(unable to capture session output)",
            error: (err as Error).message,
          });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/send-keys` && req.method === "POST") {
        const body = await readBody(req);
        const name = String(body["name"] || "0").replace(/[^a-zA-Z0-9_-]/g, "");
        const keys = String(body["keys"] || "");
        const isLiteral = Boolean(body["isLiteral"]);
        const pressEnter = Boolean(body["pressEnter"]);

        try {
          if (isLiteral) {
            if (keys) execFileSync("tmux", ["send-keys", "-t", name, "-l", keys]);
            if (pressEnter) execFileSync("tmux", ["send-keys", "-t", name, "Enter"]);
          } else if (keys) {
            execFileSync("tmux", ["send-keys", "-t", name, keys]);
          }
          sendJson(res, 200, { success: true });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/windows` && req.method === "GET") {
        const name = String(url.searchParams.get("name") || "0").replace(/[^a-zA-Z0-9_-]/g, "");
        try {
          const raw = execSync(
            `tmux list-windows -t ${name} -F "#{window_index}|#{window_name}|#{window_active}" 2>/dev/null || true`,
            { encoding: "utf-8", timeout: 1500 },
          ).trim();
          const windows = raw
            ? raw
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                  const parts = line.split("|");
                  return {
                    index: parseInt(parts[0] ?? "0", 10),
                    name: parts[1] ?? "",
                    active: parts[2] === "1",
                  };
                })
            : [];
          sendJson(res, 200, { windows });
        } catch (err) {
          sendJson(res, 200, { windows: [], error: (err as Error).message });
        }
        return;
      }

      if (
        pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/select-window` &&
        req.method === "POST"
      ) {
        const body = await readBody(req);
        const name = String(body["name"] || "0").replace(/[^a-zA-Z0-9_-]/g, "");
        const index = String(body["index"] ?? "0").replace(/[^0-9]/g, "");
        try {
          execFileSync("tmux", ["select-window", "-t", `${name}:${index}`]);
          sendJson(res, 200, { success: true });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/tmux/sessions/new-window` && req.method === "POST") {
        const body = await readBody(req);
        const name = String(body["name"] || "0").replace(/[^a-zA-Z0-9_-]/g, "");
        const windowName = String(body["windowName"] || "win").replace(/[^a-zA-Z0-9_-]/g, "");
        try {
          execFileSync("tmux", ["new-window", "-t", name, "-n", windowName]);
          sendJson(res, 200, { success: true });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }

      // Docker management endpoints
      if (pathname === `${QUOTAS_PREFIX}/api/docker/containers` && req.method === "GET") {
        try {
          const raw = execSync(
            'docker ps -a --format "{{.ID}}|{{.Image}}|{{.Status}}|{{.Names}}|{{.Ports}}|{{.Mounts}}|{{.Labels}}" 2>/dev/null || true',
            { encoding: "utf-8", timeout: 2000 },
          ).trim();
          const containers = raw
            ? raw
                .split("\n")
                .filter(Boolean)
                .map((line) => {
                  const parts = line.split("|");
                  const status = parts[2] ?? "";
                  return {
                    id: parts[0] ?? "",
                    image: parts[1] ?? "",
                    status: status,
                    name: parts[3] ?? "",
                    ports: parts[4] ?? "",
                    mounts: parts[5] ?? "",
                    labels: parts[6] ?? "",
                    isRunning: status.startsWith("Up"),
                  };
                })
            : [];
          sendJson(res, 200, { containers });
        } catch (err) {
          sendJson(res, 200, { containers: [], error: (err as Error).message });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/docker/containers/action` && req.method === "POST") {
        const body = await readBody(req);
        const id = String(body["id"] || "").replace(/[^a-zA-Z0-9_-]/g, "");
        const action = String(body["action"] || "");
        if (["start", "stop", "restart", "rm"].includes(action) && id) {
          try {
            execSync(`docker ${action} ${id}`, { timeout: 5000 });
            sendJson(res, 200, { success: true });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        } else {
          sendJson(res, 400, { error: "invalid action or container id" });
        }
        return;
      }

      if (pathname === `${QUOTAS_PREFIX}/api/docker/containers/logs` && req.method === "GET") {
        const id = String(url.searchParams.get("id") || "").replace(/[^a-zA-Z0-9_-]/g, "");
        if (id) {
          try {
            const logs = execSync(`docker logs --tail 100 ${id} 2>&1`, {
              encoding: "utf-8",
              timeout: 3000,
            });
            sendJson(res, 200, { logs });
          } catch (err) {
            sendJson(res, 200, {
              logs: "(unable to fetch container logs)",
              error: (err as Error).message,
            });
          }
        } else {
          sendJson(res, 400, { error: "container id required" });
        }
        return;
      }

      // GET /quotas/api/fs — Filesystem Explorer
      if (pathname === `${QUOTAS_PREFIX}/api/fs` && req.method === "GET") {
        const rawPath = url.searchParams.get("path") || "/";
        const targetPath = path.resolve(rawPath);
        try {
          const stat = fs.statSync(targetPath);
          if (!stat.isDirectory()) {
            sendJson(res, 200, {
              path: targetPath,
              isFile: true,
              size: stat.size,
              mtime: stat.mtimeMs,
              entries: [],
            });
            return;
          }
          const rawEntries = fs.readdirSync(targetPath, { withFileTypes: true });
          const entries = [];
          for (const dirent of rawEntries) {
            if (
              dirent.name.startsWith(".") &&
              dirent.name !== ".cursor" &&
              dirent.name !== ".agents"
            )
              continue;
            try {
              const full = path.join(targetPath, dirent.name);
              const isDir = dirent.isDirectory();
              const isVendor =
                dirent.name === "node_modules" ||
                dirent.name === "dist" ||
                dirent.name === "lib" ||
                dirent.name === ".git";
              let isRepo = false;
              if (isDir && !isVendor) {
                try {
                  isRepo =
                    fs.existsSync(path.join(full, ".git")) ||
                    fs.existsSync(path.join(full, ".github")) ||
                    fs.existsSync(path.join(full, ".gitmodules"));
                } catch {}
              }
              entries.push({
                name: dirent.name,
                path: full,
                isDirectory: isDir,
                isFile: dirent.isFile(),
                isRepo,
              });
            } catch {}
          }
          // Sort directories first, then alphabetical
          entries.sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
          const parent = path.dirname(targetPath);
          sendJson(res, 200, {
            path: targetPath,
            parent: parent !== targetPath ? parent : null,
            entries,
          });
        } catch (err) {
          sendJson(res, 200, {
            path: targetPath,
            parent: null,
            entries: [],
            error: (err as Error).message,
          });
        }
        return;
      }

      // GET /quotas/api/fs/read — Read file contents for inspector/preview/monaco
      if (pathname === `${QUOTAS_PREFIX}/api/fs/read` && req.method === "GET") {
        const rawPath = url.searchParams.get("path") || "";
        if (!rawPath) {
          sendJson(res, 400, { error: "path parameter required" });
          return;
        }
        const targetPath = path.resolve(rawPath);
        try {
          const stat = fs.statSync(targetPath);
          if (stat.isDirectory()) {
            sendJson(res, 200, {
              path: targetPath,
              name: path.basename(targetPath),
              isDirectory: true,
              content: "",
            });
            return;
          }
          if (stat.size > 2 * 1024 * 1024) {
            sendJson(res, 200, {
              path: targetPath,
              name: path.basename(targetPath),
              size: stat.size,
              content: "(File exceeds 2MB preview limit)",
              isTruncated: true,
            });
            return;
          }
          const content = fs.readFileSync(targetPath, "utf-8");
          sendJson(res, 200, {
            path: targetPath,
            name: path.basename(targetPath),
            size: stat.size,
            content,
            isDirectory: false,
          });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }

      // GET /quotas/api/fs/icon — Native application & executable icon extraction via sips
      if (pathname === `${QUOTAS_PREFIX}/api/fs/icon` && req.method === "GET") {
        const rawPath = url.searchParams.get("path") || "";
        if (!rawPath) {
          sendJson(res, 400, { error: "path parameter required" });
          return;
        }
        const targetPath = path.resolve(rawPath);
        try {
          if (!fs.existsSync(targetPath)) {
            sendJson(res, 404, { error: "File not found" });
            return;
          }
          const cacheDir = path.join(os.homedir(), ".agents/cache/app-icons");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          const hash = crypto.createHash("md5").update(targetPath).digest("hex");
          const cachePng = path.join(cacheDir, `${hash}.png`);

          if (fs.existsSync(cachePng)) {
            res.writeHead(200, {
              "content-type": "image/png",
              "cache-control": "public, max-age=86400",
            });
            fs.createReadStream(cachePng).pipe(res);
            return;
          }

          let icnsPath: string | null = null;
          if (targetPath.endsWith(".app")) {
            const infoPlist = path.join(targetPath, "Contents/Info.plist");
            if (fs.existsSync(infoPlist)) {
              try {
                let iconName = execFileSync("defaults", ["read", infoPlist, "CFBundleIconFile"], {
                  encoding: "utf-8",
                  timeout: 2000,
                }).trim();
                if (iconName) {
                  if (!iconName.endsWith(".icns")) iconName += ".icns";
                  const candidate = path.join(targetPath, "Contents/Resources", iconName);
                  if (fs.existsSync(candidate)) icnsPath = candidate;
                }
              } catch {}
            }
            if (!icnsPath) {
              const resDir = path.join(targetPath, "Contents/Resources");
              if (fs.existsSync(resDir)) {
                try {
                  const files = fs.readdirSync(resDir);
                  const icns = files.find((f) => f.endsWith(".icns"));
                  if (icns) icnsPath = path.join(resDir, icns);
                } catch {}
              }
            }
          } else if (targetPath.endsWith(".icns")) {
            icnsPath = targetPath;
          }

          if (icnsPath && fs.existsSync(icnsPath)) {
            try {
              execFileSync(
                "sips",
                ["-s", "format", "png", "-z", "32", "32", icnsPath, "--out", cachePng],
                { timeout: 3000 },
              );
              if (fs.existsSync(cachePng)) {
                res.writeHead(200, {
                  "content-type": "image/png",
                  "cache-control": "public, max-age=86400",
                });
                fs.createReadStream(cachePng).pipe(res);
                return;
              }
            } catch {}
          }

          sendJson(res, 404, { error: "No icon available for target" });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }

      // POST /quotas/api/fs/write — Save file contents from monaco editor
      if (pathname === `${QUOTAS_PREFIX}/api/fs/write` && req.method === "POST") {
        let bodyStr = "";
        req.on("data", (chunk) => {
          bodyStr += chunk;
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(bodyStr || "{}");
            const targetPath = path.resolve(data.path || "");
            if (!targetPath) {
              sendJson(res, 400, { error: "Invalid path" });
              return;
            }
            fs.writeFileSync(targetPath, data.content || "", "utf-8");
            sendJson(res, 200, {
              success: true,
              path: targetPath,
              size: Buffer.byteLength(data.content || "", "utf-8"),
            });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        });
        return;
      }

      // GET /quotas/api/git/overview — Complete GitHub-parity repository overview
      if (pathname === `${QUOTAS_PREFIX}/api/git/overview` && req.method === "GET") {
        const repoPath = url.searchParams.get("path") || "";
        const subPath = url.searchParams.get("subpath") || "";
        if (!repoPath) {
          sendJson(res, 400, { error: "path parameter required" });
          return;
        }
        try {
          // 1. Remote URL & Owner / Repo name
          let remoteUrl = "";
          try {
            remoteUrl = execSync("git remote get-url origin", {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 3000,
            }).trim();
          } catch {}
          let repoName = path.basename(repoPath);
          let owner = "workspace";
          if (remoteUrl) {
            const match = remoteUrl.match(/[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
            if (match && match[1] && match[2]) {
              owner = match[1];
              repoName = match[2];
            }
          }

          // 2. Current branch & default branch
          let branch = "main";
          try {
            branch =
              execSync("git branch --show-current", {
                cwd: repoPath,
                encoding: "utf-8",
                timeout: 3000,
              }).trim() || "main";
          } catch {}

          // 3. Stats: Commits count, tags count, branches count
          let totalCommits = 0;
          try {
            const cStr = execSync("git rev-list --count HEAD", {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 3000,
            }).trim();
            totalCommits = parseInt(cStr, 10) || 0;
          } catch {}

          let tagsCount = 0;
          try {
            const tStr = execSync("git tag", {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 3000,
            }).trim();
            tagsCount = tStr ? tStr.split("\n").length : 0;
          } catch {}

          let branchesCount = 1;
          try {
            const bStr = execSync("git branch -a", {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 3000,
            }).trim();
            branchesCount = bStr ? bStr.split("\n").length : 1;
          } catch {}

          // 4. Latest commit
          let latestCommit = {
            sha: "",
            shortSha: "",
            author: "",
            date: "",
            message: "",
            fullMessage: "",
          };
          try {
            const lRaw = execSync(
              'git log -1 --pretty=format:"%H%x09%h%x09%an%x09%ar%x09%s%x09%B"',
              { cwd: repoPath, encoding: "utf-8", timeout: 3000 },
            ).trim();
            const parts = lRaw.split("\t");
            latestCommit = {
              sha: parts[0] || "",
              shortSha: parts[1] || "",
              author: parts[2] || "",
              date: parts[3] || "",
              message: parts[4] || "",
              fullMessage: parts[5] || parts[4] || "",
            };
          } catch {}

          // 5. File tree at current (sub)path with last commit for each item
          const targetDir = subPath ? path.join(repoPath, subPath) : repoPath;
          const tree: Array<{
            name: string;
            type: "blob" | "tree";
            path: string;
            relPath: string;
            lastCommitMsg: string;
            lastCommitDate: string;
            size?: number;
          }> = [];
          try {
            const refPath = subPath ? `HEAD:${subPath}` : "HEAD";
            const treeRaw = execSync(`git ls-tree ${refPath}`, {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 4000,
            }).trim();
            if (treeRaw) {
              const lines = treeRaw.split("\n");
              for (const line of lines) {
                const parts = line.split(/\s+/);
                if (parts.length >= 4) {
                  const type = parts[1] === "tree" ? "tree" : "blob";
                  const name = line.substring(line.indexOf("\t") + 1).trim();
                  const itemRelPath = subPath ? `${subPath}/${name}` : name;
                  const itemFullPath = path.join(repoPath, itemRelPath);
                  let lastCommitMsg = "";
                  let lastCommitDate = "";
                  try {
                    const cLog = execSync(
                      `git log -1 --pretty=format:"%s%x09%ar" -- "${itemRelPath}"`,
                      { cwd: repoPath, encoding: "utf-8", timeout: 2000 },
                    ).trim();
                    const cParts = cLog.split("\t");
                    lastCommitMsg = cParts[0] || "";
                    lastCommitDate = cParts[1] || "";
                  } catch {}
                  tree.push({
                    name,
                    type,
                    path: itemFullPath,
                    relPath: itemRelPath,
                    lastCommitMsg,
                    lastCommitDate,
                  });
                }
              }
            }
          } catch {}

          // Sort tree: folders first, then files alphabetically
          tree.sort((a, b) => {
            if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });

          // 6. README.md content if available
          let readme: { name: string; content: string } | null = null;
          const readmeCandidates = ["README.md", "readme.md", "README.txt", "README"];
          for (const cand of readmeCandidates) {
            const candPath = path.join(repoPath, cand);
            if (fs.existsSync(candPath)) {
              try {
                readme = {
                  name: cand,
                  content: fs.readFileSync(candPath, "utf-8"),
                };
                break;
              } catch {}
            }
          }

          // 7. Languages breakdown from git ls-files
          const languages: Array<{ name: string; percent: number; color: string }> = [];
          try {
            const filesRaw = execSync("git ls-files", {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 3000,
            }).trim();
            const extCounts: Record<string, number> = {};
            let totalExt = 0;
            if (filesRaw) {
              for (const f of filesRaw.split("\n")) {
                const ext = path.extname(f).toLowerCase();
                if (
                  ext &&
                  !f.includes("node_modules") &&
                  !f.includes("dist") &&
                  !f.includes("lib/")
                ) {
                  extCounts[ext] = (extCounts[ext] || 0) + 1;
                  totalExt++;
                }
              }
            }
            const extMap: Record<string, { name: string; color: string }> = {
              ".ts": { name: "TypeScript", color: "#3178c6" },
              ".tsx": { name: "TypeScript", color: "#3178c6" },
              ".js": { name: "JavaScript", color: "#f7df1e" },
              ".jsx": { name: "JavaScript", color: "#f7df1e" },
              ".mjs": { name: "JavaScript", color: "#f7df1e" },
              ".json": { name: "JSON", color: "#292929" },
              ".md": { name: "Markdown", color: "#083fa1" },
              ".sh": { name: "Shell", color: "#89e051" },
              ".bash": { name: "Shell", color: "#89e051" },
              ".py": { name: "Python", color: "#3572A5" },
              ".go": { name: "Go", color: "#00ADD8" },
              ".rs": { name: "Rust", color: "#dea584" },
              ".css": { name: "CSS", color: "#563d7c" },
              ".html": { name: "HTML", color: "#e34c26" },
              ".yaml": { name: "YAML", color: "#cb171e" },
              ".yml": { name: "YAML", color: "#cb171e" },
            };
            const langCounts: Record<string, { count: number; color: string }> = {};
            for (const [ext, count] of Object.entries(extCounts)) {
              const info = extMap[ext] || { name: "Other", color: "#8b949e" };
              if (!langCounts[info.name]) langCounts[info.name] = { count: 0, color: info.color };
              const entry = langCounts[info.name];
              if (entry) entry.count += count;
            }
            for (const [name, data] of Object.entries(langCounts)) {
              const pct = totalExt > 0 ? Math.round((data.count / totalExt) * 100) : 0;
              if (pct > 0) {
                languages.push({ name, percent: pct, color: data.color });
              }
            }
            languages.sort((a, b) => b.percent - a.percent);
          } catch {}

          sendJson(res, 200, {
            repoPath,
            repoName,
            owner,
            remoteUrl,
            branch,
            totalCommits,
            branchesCount,
            tagsCount,
            latestCommit,
            tree,
            subPath,
            readme,
            languages,
          });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }

      // GET /quotas/api/git/diff — Full unified diff or file-specific diff
      if (pathname === `${QUOTAS_PREFIX}/api/git/diff` && req.method === "GET") {
        const repoPath = url.searchParams.get("path") || "";
        const file = url.searchParams.get("file") || "";
        if (!repoPath) {
          sendJson(res, 400, { error: "path parameter required" });
          return;
        }
        try {
          const cmd = file ? `git diff HEAD -- "${file}"` : "git diff HEAD";
          const diff = execSync(cmd, { cwd: repoPath, encoding: "utf-8", timeout: 5000 });
          sendJson(res, 200, { repoPath, file, diff });
        } catch (err) {
          sendJson(res, 200, { repoPath, file, diff: "", error: (err as Error).message });
        }
        return;
      }

      // GET /quotas/api/git/status — Git status for repository workbench tab
      if (pathname === `${QUOTAS_PREFIX}/api/git/status` && req.method === "GET") {
        const repoPath = url.searchParams.get("path") || "";
        if (!repoPath) {
          sendJson(res, 400, { error: "path parameter required" });
          return;
        }
        try {
          const raw = execSync("git status --porcelain=v1 -b", {
            cwd: repoPath,
            encoding: "utf-8",
            timeout: 5000,
          }).trim();
          const lines = raw.split("\n");
          let branch = "HEAD";
          let ahead = 0;
          let behind = 0;
          const files: Array<{ code: string; path: string; staged: boolean; status: string }> = [];
          for (const line of lines) {
            if (line.startsWith("## ")) {
              const bInfo = line.slice(3);
              const match = bInfo.match(/^([^.\s]+)/);
              if (match && match[1]) branch = match[1];
              const aheadMatch = bInfo.match(/ahead (\d+)/);
              if (aheadMatch && aheadMatch[1]) ahead = parseInt(aheadMatch[1], 10);
              const behindMatch = bInfo.match(/behind (\d+)/);
              if (behindMatch && behindMatch[1]) behind = parseInt(behindMatch[1], 10);
            } else if (line.length >= 4) {
              const x = line[0];
              const y = line[1];
              const fPath = line.slice(3).trim();
              const staged = x !== " " && x !== "?";
              let status = "modified";
              if (x === "?" || y === "?") status = "untracked";
              else if (x === "A" || y === "A") status = "added";
              else if (x === "D" || y === "D") status = "deleted";
              files.push({ code: line.slice(0, 2), path: fPath, staged, status });
            }
          }
          sendJson(res, 200, { repoPath, branch, ahead, behind, files });
        } catch (err) {
          sendJson(res, 200, {
            repoPath,
            branch: "unknown",
            ahead: 0,
            behind: 0,
            files: [],
            error: (err as Error).message,
          });
        }
        return;
      }

      // GET /quotas/api/git/log — Recent commits for repository workbench tab
      if (pathname === `${QUOTAS_PREFIX}/api/git/log` && req.method === "GET") {
        const repoPath = url.searchParams.get("path") || "";
        try {
          const raw = execSync(
            'git log -n 50 --pretty=format:"%H%x09%h%x09%an%x09%ar%x09%s%x09%ad" --date=short',
            { cwd: repoPath, encoding: "utf-8", timeout: 5000 },
          ).trim();
          const commits = raw
            ? raw.split("\n").map((l) => {
                const parts = l.split("\t");
                return {
                  fullSha: parts[0] || "",
                  sha: parts[1] || parts[0]?.slice(0, 7) || "",
                  author: parts[2] || "",
                  date: parts[3] || "",
                  message: parts[4] || "",
                  dateFormatted: parts[5] || "",
                };
              })
            : [];
          sendJson(res, 200, { repoPath, commits });
        } catch (err) {
          sendJson(res, 200, { repoPath, commits: [], error: (err as Error).message });
        }
        return;
      }

      // GET /quotas/api/git/branches — Branch list
      if (pathname === `${QUOTAS_PREFIX}/api/git/branches` && req.method === "GET") {
        const repoPath = url.searchParams.get("path") || "";
        try {
          const raw = execSync("git branch -a", {
            cwd: repoPath,
            encoding: "utf-8",
            timeout: 5000,
          }).trim();
          let current = "main";
          const branches = raw
            ? raw.split("\n").map((b) => {
                const isCurrent = b.startsWith("*");
                const name = b.replace(/^[* ]+/, "").trim();
                if (isCurrent) current = name;
                return { name, isCurrent };
              })
            : [];
          sendJson(res, 200, { repoPath, current, branches });
        } catch (err) {
          sendJson(res, 200, {
            repoPath,
            current: "main",
            branches: [],
            error: (err as Error).message,
          });
        }
        return;
      }

      // POST /quotas/api/git/checkout — Switch branch or create new branch
      if (pathname === `${QUOTAS_PREFIX}/api/git/checkout` && req.method === "POST") {
        let bodyStr = "";
        req.on("data", (c) => {
          bodyStr += c;
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(bodyStr || "{}");
            const repoPath = data.path;
            const branch = data.branch;
            const isNew = Boolean(data.create);
            const args = isNew ? ["checkout", "-b", branch] : ["checkout", branch];
            const out = execFileSync("git", args, {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 5000,
            }).trim();
            sendJson(res, 200, { success: true, output: out });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        });
        return;
      }

      // POST /quotas/api/git/discard — Discard changes
      if (pathname === `${QUOTAS_PREFIX}/api/git/discard` && req.method === "POST") {
        let bodyStr = "";
        req.on("data", (c) => {
          bodyStr += c;
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(bodyStr || "{}");
            const repoPath = data.path;
            const file = data.file;
            if (file) {
              execFileSync("git", ["checkout", "--", file], {
                cwd: repoPath,
                encoding: "utf-8",
                timeout: 5000,
              });
            } else {
              execFileSync("git", ["checkout", "--", "."], {
                cwd: repoPath,
                encoding: "utf-8",
                timeout: 5000,
              });
              execFileSync("git", ["clean", "-fd"], {
                cwd: repoPath,
                encoding: "utf-8",
                timeout: 5000,
              });
            }
            sendJson(res, 200, { success: true });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        });
        return;
      }

      // POST /quotas/api/git/stash — Stash changes
      if (pathname === `${QUOTAS_PREFIX}/api/git/stash` && req.method === "POST") {
        let bodyStr = "";
        req.on("data", (c) => {
          bodyStr += c;
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(bodyStr || "{}");
            const repoPath = data.path;
            const out = execFileSync("git", ["stash"], {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 5000,
            }).trim();
            sendJson(res, 200, { success: true, output: out });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        });
        return;
      }

      // POST /quotas/api/git/commit — Commit changes
      if (pathname === `${QUOTAS_PREFIX}/api/git/commit` && req.method === "POST") {
        let bodyStr = "";
        req.on("data", (c) => {
          bodyStr += c;
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(bodyStr || "{}");
            const repoPath = data.path;
            const msg = data.message || "Update";
            execFileSync("git", ["add", "-A"], { cwd: repoPath, encoding: "utf-8", timeout: 5000 });
            const out = execFileSync("git", ["commit", "-m", msg], {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 5000,
            }).trim();
            sendJson(res, 200, { success: true, output: out });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        });
        return;
      }

      // POST /quotas/api/git/push — Push commits
      if (pathname === `${QUOTAS_PREFIX}/api/git/push` && req.method === "POST") {
        let bodyStr = "";
        req.on("data", (c) => {
          bodyStr += c;
        });
        req.on("end", () => {
          try {
            const data = JSON.parse(bodyStr || "{}");
            const repoPath = data.path;
            const out = execFileSync("git", ["push"], {
              cwd: repoPath,
              encoding: "utf-8",
              timeout: 15000,
            }).trim();
            sendJson(res, 200, { success: true, output: out });
          } catch (err) {
            sendJson(res, 500, { error: (err as Error).message });
          }
        });
        return;
      }

      // POST /quotas/api/sessions/archive-pong — Archive empty and pong sessions
      if (pathname === `${QUOTAS_PREFIX}/api/sessions/archive-pong` && req.method === "POST") {
        try {
          const wsFile = path.join(os.homedir(), ".agents/storages/workspace.json");
          let archivedCount = 0;
          if (fs.existsSync(wsFile)) {
            const ws = JSON.parse(fs.readFileSync(wsFile, "utf8"));
            const archived = new Set(ws.global?.archivedSessionIds || []);
            const workspaces = ws.tables?.workspaces || {};
            for (const [wId, w] of Object.entries(workspaces)) {
              const activeIds = (w as { sessionIds?: string[] }).sessionIds || [];
              const toKeep: string[] = [];
              for (const id of activeIds) {
                let isEmpty = true;
                for (const sub of [
                  "--Users-user--",
                  "--Users-user-Projects-dsh-stack--",
                  "--Users-user-agents--",
                ]) {
                  const fPath = path.join(
                    os.homedir(),
                    ".agents/sessions",
                    sub,
                    id,
                    "session.jsonl.zstd",
                  );
                  if (fs.existsSync(fPath)) {
                    try {
                      const zlib = require("node:zlib");
                      const compressed = fs.readFileSync(fPath);
                      const decomp = zlib.zstdDecompressSync(compressed);
                      const lines = decomp.toString("utf8").trim().split("\n");
                      if (lines.length > 1) {
                        const text = decomp.toString("utf8").toLowerCase();
                        if (!text.includes("pong") && !text.includes("ping")) {
                          isEmpty = false;
                        }
                      }
                    } catch {}
                  }
                }
                if (isEmpty) {
                  archived.add(id);
                  archivedCount++;
                } else {
                  toKeep.push(id);
                }
              }
              (w as { sessionIds?: string[] }).sessionIds = toKeep;
            }
            ws.global.archivedSessionIds = Array.from(archived);
            fs.writeFileSync(wsFile, JSON.stringify(ws, null, 2), "utf8");
          }
          sendJson(res, 200, { success: true, archivedCount });
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
        return;
      }
      // GET /quotas — HTML dashboard
      if (pathname === QUOTAS_PREFIX && req.method === "GET") {
        const snapshots = registry.all();
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        });
        res.end(renderDashboard(snapshots));
        return;
      }

      // GET /quotas/api/snapshots — all snapshots as JSON
      if (pathname === `${QUOTAS_PREFIX}/api/snapshots` && req.method === "GET") {
        sendJson(res, 200, { snapshots: registry.all() });
        return;
      }

      // GET /quotas/api/summary — aggregated summary
      if (pathname === `${QUOTAS_PREFIX}/api/summary` && req.method === "GET") {
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
        sendJson(res, 200, summary);
        return;
      }

      // POST /quotas/api/refresh/:provider — refresh a single provider
      const refreshPrefix = `${QUOTAS_PREFIX}/api/refresh/`;
      if (pathname.startsWith(refreshPrefix) && req.method === "POST") {
        const provider = decodeURIComponent(pathname.slice(refreshPrefix.length));
        const snapshot = await registry.refresh(provider);
        sendJson(res, 200, { snapshot });
        return;
      }

      // POST /quotas/api/refresh — refresh all providers
      if (pathname === `${QUOTAS_PREFIX}/api/refresh` && req.method === "POST") {
        const snapshots: Array<{ provider: string; status: string; remaining?: number }> = [];
        for (const snap of registry.all()) {
          const refreshed = await registry.refresh(snap.provider);
          snapshots.push({
            provider: refreshed.provider,
            status: refreshed.status,
            remaining: refreshed.remaining,
          });
        }
        sendJson(res, 200, { snapshots });
        return;
      }

      res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "not found" }));
    } catch (err) {
      sendJson(res, 500, { error: (err as Error).message });
    }
  };
}

/* -------------------------------------------------------------------------- */
/* HTML Dashboard                                                              */
/* -------------------------------------------------------------------------- */

function renderDashboard(snapshots: readonly QuotaSnapshot[]): string {
  const rows = snapshots
    .map((s: QuotaSnapshot) => {
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
    })
    .join("\n");

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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
