import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import * as fs from "node:fs";
import * as path from "node:path";

export const name = "package-managers";
export const inject = ["tools", "integrations", "webServer"];
export const optional: string[] = [];

export interface DetectedRuntime {
  type: "bun" | "pnpm" | "npm" | "yarn" | "cargo" | "uv" | "pip";
  lockfile: string;
  command: string;
  versionRequired?: string;
}

export class PackageManagersService {
  private customRunners = new Map<string, (script: string, cwd: string) => Promise<string>>();

    /** Constructs an instance. */
constructor(private ctx: Context) {
    this.registerPackageTools();
  }

    /** detect implementation. */
detect(projectPath: string): DetectedRuntime[] {
    const results: DetectedRuntime[] = [];

    const checks: Array<{ lock: string; type: DetectedRuntime["type"]; cmd: string }> = [
      { lock: "bun.lock", type: "bun", cmd: "bun" },
      { lock: "bun.lockb", type: "bun", cmd: "bun" },
      { lock: "pnpm-lock.yaml", type: "pnpm", cmd: "pnpm" },
      { lock: "yarn.lock", type: "yarn", cmd: "yarn" },
      { lock: "package-lock.json", type: "npm", cmd: "npm" },
      { lock: "Cargo.lock", type: "cargo", cmd: "cargo" },
      { lock: "Cargo.toml", type: "cargo", cmd: "cargo" },
      { lock: "uv.lock", type: "uv", cmd: "uv" },
      { lock: "requirements.txt", type: "pip", cmd: "pip" },
      { lock: "pyproject.toml", type: "uv", cmd: "uv" },
    ];

    for (const c of checks) {
      try {
        if (fs.existsSync(path.join(projectPath, c.lock))) {
          let versionRequired: string | undefined;
          const nvmrc = path.join(projectPath, ".nvmrc");
          const nodeVer = path.join(projectPath, ".node-version");
          if (fs.existsSync(nvmrc)) {
            versionRequired = fs.readFileSync(nvmrc, "utf-8").trim();
          } else if (fs.existsSync(nodeVer)) {
            versionRequired = fs.readFileSync(nodeVer, "utf-8").trim();
          }
          results.push({ type: c.type, lockfile: c.lock, command: c.cmd, versionRequired });
        }
      } catch {}
    }

    if (results.length === 0) {
      // Fallback default: npm if package.json exists
      try {
        if (fs.existsSync(path.join(projectPath, "package.json"))) {
          results.push({ type: "npm", lockfile: "package.json", command: "npm" });
        }
      } catch {}
    }

    return results;
  }

    /** registerPackageTools implementation. */
private registerPackageTools(): void {
    const tools = (this.ctx as any).tools;
    if (!tools || typeof tools.registerTool !== "function") return;

    // 1. run_package_script
    tools.registerTool({
      name: "run_package_script",
      description:
        "Execute build, test, or custom scripts using the detected package manager (bun, pnpm, npm, cargo, uv)",
      parameters: {
        type: "object",
        properties: {
          script: {
            type: "string",
            description: 'Script name or command to run (e.g. "build", "test", "lint")',
          },
          path: { type: "string", description: "Target project directory path" },
        },
        required: ["script"],
      },
      execute: async (params: { script: string; path?: string }) => {
        const targetPath = params.path || process.cwd();
        const detected = this.detect(targetPath);
        const pm = detected[0]?.command || "npm";
        return {
          command: `${pm} run ${params.script}`,
          manager: pm,
          status: "dispatched",
          cwd: targetPath,
        };
      },
    });

    // 2. install_package
    tools.registerTool({
      name: "install_package",
      description: "Install dependencies using the project-appropriate package manager",
      parameters: {
        type: "object",
        properties: {
          packages: {
            type: "string",
            description: "Package names separated by space (or empty for all deps)",
          },
          dev: { type: "boolean", description: "Install as dev dependency" },
          path: { type: "string", description: "Target directory" },
        },
      },
      execute: async (params: { packages?: string; dev?: boolean; path?: string }) => {
        const targetPath = params.path || process.cwd();
        const detected = this.detect(targetPath);
        const pm = detected[0]?.command || "npm";
        const isDev = Boolean(params.dev);
        const pkgs = params.packages || "";
        let cmd = `${pm} install`;
        if (pm === "bun") cmd = `bun add ${isDev ? "-d " : ""}${pkgs}`.trim();
        else if (pm === "pnpm") cmd = `pnpm add ${isDev ? "-D " : ""}${pkgs}`.trim();
        else if (pm === "yarn") cmd = `yarn add ${isDev ? "--dev " : ""}${pkgs}`.trim();
        else if (pkgs) cmd = `npm install ${isDev ? "--save-dev " : ""}${pkgs}`.trim();

        return { command: cmd, manager: pm, cwd: targetPath, status: "dispatched" };
      },
    });

    // 3. switch_node_version
    tools.registerTool({
      name: "switch_node_version",
      description:
        "Check or activate required Node.js version from .nvmrc or specified version string",
      parameters: {
        type: "object",
        properties: {
          version: { type: "string", description: 'Node version (e.g. "20", "22", "lts")' },
          path: { type: "string", description: "Directory containing .nvmrc" },
        },
      },
      execute: async (params: { version?: string; path?: string }) => {
        let ver = params.version;
        if (!ver && params.path) {
          const nvmrc = path.join(params.path, ".nvmrc");
          if (fs.existsSync(nvmrc)) {
            ver = fs.readFileSync(nvmrc, "utf-8").trim();
          }
        }
        return { activeVersion: ver || "current", source: ver ? "nvmrc" : "environment" };
      },
    });
  }
}

export const Config = Schema.object({
  preferBun: Schema.boolean().default(true),
  autoSwitchNode: Schema.boolean().default(true),
});

/** apply implementation. */
export function apply(ctx: Context, config: any) {
  const service = new PackageManagersService(ctx);
  (ctx as any).packageManagers = service;
}
