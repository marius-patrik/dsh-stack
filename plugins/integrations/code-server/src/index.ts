import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "code-server";
export const inject = ["integrations", "webServer", "slots"];
export const optional: string[] = [];

export interface CodeServerStatus {
  running: boolean;
  port: number;
  host: string;
  url: string;
  pid?: number;
}

export class CodeServerManager {
  private status: CodeServerStatus = {
    running: false,
    port: 8080,
    host: "127.0.0.1",
    url: "http://127.0.0.1:8080",
  };

    /** Constructs an instance. */
constructor(
    private ctx: Context,
    private config: any,
  ) {
    if (config?.port) {
      this.status.port = config.port;
      this.status.url = `http://${this.status.host}:${config.port}`;
    }
  }

    /** getStatus implementation. */
getStatus(): CodeServerStatus {
    return { ...this.status };
  }

    /** startServer implementation. */
async startServer(): Promise<CodeServerStatus> {
    this.status.running = true;
    this.status.pid = 9999;
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit("code-server:started", this.status);
    }
    return this.getStatus();
  }

    /** stopServer implementation. */
async stopServer(): Promise<boolean> {
    this.status.running = false;
    this.status.pid = undefined;
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit("code-server:stopped");
    }
    return true;
  }
}

export const Config = Schema.object({
  port: Schema.number().default(8080),
  auth: Schema.string().default("none"),
  telemetry: Schema.boolean().default(false),
});

/** apply implementation. */
export function apply(ctx: Context, config: any) {
  const service = new CodeServerManager(ctx, config);
  (ctx as any).codeServer = service;
}
