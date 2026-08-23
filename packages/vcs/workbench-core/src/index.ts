import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import * as fs from "node:fs";

export const name = "workbench-core";
export const inject = ["tools", "webServer"];
export const optional = ["icons"];

export interface RepoDetails {
  path: string;
  branch: string;
  remoteUrl?: string;
  isLocalOnly: boolean;
  ahead: number;
  behind: number;
  uncommittedChanges: number;
}

export class ReposWorkbenchService {
  private repos = new Map<string, RepoDetails>();

  constructor(private ctx: Context) {
    this.registerVcsTools();
  }

  registerRepo(details: RepoDetails): void {
    this.repos.set(details.path, details);
  }

  getRepo(targetPath: string): RepoDetails | undefined {
    return this.repos.get(targetPath);
  }

  listRepos(): RepoDetails[] {
    return Array.from(this.repos.values());
  }

  getOverview(repoPath: string) {
    let branch = "main";
    let isLocalOnly = true;
    let remoteUrl: string | undefined;

    try {
      branch =
        execFileSync("git", ["branch", "--show-current"], {
          cwd: repoPath,
          encoding: "utf-8",
          timeout: 3000,
        }).trim() || "main";
    } catch {}

    try {
      remoteUrl = execFileSync("git", ["remote", "get-url", "origin"], {
        cwd: repoPath,
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      isLocalOnly = !remoteUrl;
    } catch {}

    let uncommittedCount = 0;
    try {
      const status = execFileSync("git", ["status", "--porcelain"], {
        cwd: repoPath,
        encoding: "utf-8",
        timeout: 3000,
      }).trim();
      uncommittedCount = status ? status.split("\n").length : 0;
    } catch {}

    return {
      path: repoPath,
      repoName: path.basename(repoPath),
      branch,
      remoteUrl,
      isLocalOnly,
      uncommittedChanges: uncommittedCount,
    };
  }

  private registerVcsTools(): void {
    const tools = (this.ctx as any).tools;
    if (!tools || typeof tools.registerTool !== "function") return;

    // 1. git_status
    tools.registerTool({
      name: "git_status",
      description:
        "Get git status, modified files, and current branch for a repository (supports 100% offline local repos)",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Repository directory path" },
        },
      },
      execute: async (params: { path?: string }) => {
        const repoPath = params.path || process.cwd();
        try {
          const raw = execFileSync("git", ["status", "--porcelain=v1", "-b"], {
            cwd: repoPath,
            encoding: "utf-8",
            timeout: 5000,
          }).trim();
          return { path: repoPath, status: raw, isLocal: true };
        } catch (e: any) {
          return { path: repoPath, error: e.message };
        }
      },
    });

    // 2. git_diff
    tools.registerTool({
      name: "git_diff",
      description: "Get unified diff for working tree or specific file in a repository",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Repository directory path" },
          file: { type: "string", description: "Optional specific file to diff" },
        },
      },
      execute: async (params: { path?: string; file?: string }) => {
        const repoPath = params.path || process.cwd();
        try {
          const args = params.file ? ["diff", "HEAD", "--", params.file] : ["diff", "HEAD"];
          const diff = execFileSync("git", args, {
            cwd: repoPath,
            encoding: "utf-8",
            timeout: 5000,
          });
          return { path: repoPath, file: params.file || "all", diff };
        } catch (e: any) {
          return { path: repoPath, diff: "", error: e.message };
        }
      },
    });

    // 3. git_commit
    tools.registerTool({
      name: "git_commit",
      description: "Stage and commit changes in a repository",
      parameters: {
        type: "object",
        properties: {
          message: { type: "string", description: "Commit message" },
          path: { type: "string", description: "Repository directory path" },
        },
        required: ["message"],
      },
      execute: async (params: { message: string; path?: string }) => {
        const repoPath = params.path || process.cwd();
        try {
          execFileSync("git", ["add", "-A"], { cwd: repoPath, encoding: "utf-8", timeout: 5000 });
          const out = execFileSync("git", ["commit", "-m", params.message], {
            cwd: repoPath,
            encoding: "utf-8",
            timeout: 5000,
          }).trim();
          return { success: true, output: out };
        } catch (e: any) {
          return { success: false, error: e.message };
        }
      },
    });
  }
}

export const Config = Schema.object({
  enableAutoFetch: Schema.boolean().default(false),
  supportLocalOnly: Schema.boolean().default(true),
});

export function apply(ctx: Context, config: any) {
  const service = new ReposWorkbenchService(ctx);
  (ctx as any).repos = service;
}
