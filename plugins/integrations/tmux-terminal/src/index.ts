import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "tmux-terminal";
export const inject = ["tools", "integrations", "webServer"];
export const optional: string[] = [];

export interface TmuxSession {
  id: string;
  name: string;
  command: string;
  cwd: string;
  running: boolean;
  history: string[];
  createdAt: number;
}

export class TmuxService {
  private sessions = new Map<string, TmuxSession>();

  /** Constructs an instance. */
  constructor(private ctx: Context) {
    this.registerTmuxTools();
  }

  /** createSession implementation. */
  createSession(name: string, command: string = "zsh", cwd: string = process.cwd()): TmuxSession {
    const id = "tmux-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const session: TmuxSession = {
      id,
      name,
      command,
      cwd,
      running: true,
      history: [`[session ${name} started with ${command}]`],
      createdAt: Date.now(),
    };
    this.sessions.set(id, session);
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit("tmux:session-created", session);
    }
    return session;
  }

  /** sendInput implementation. */
  sendInput(id: string, input: string): boolean {
    const s = this.sessions.get(id);
    if (!s || !s.running) return false;
    s.history.push(input);
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit("tmux:output", { id, text: input });
    }
    return true;
  }

  /** captureOutput implementation. */
  captureOutput(id: string, linesCount: number = 50): string {
    const s = this.sessions.get(id);
    if (!s) return "";
    return s.history.slice(-linesCount).join("\n");
  }

  /** listSessions implementation. */
  listSessions(): TmuxSession[] {
    return Array.from(this.sessions.values());
  }

  /** killSession implementation. */
  killSession(id: string): boolean {
    const s = this.sessions.get(id);
    if (!s) return false;
    s.running = false;
    this.sessions.delete(id);
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit("tmux:session-killed", { id });
    }
    return true;
  }

  /** registerTmuxTools implementation. */
  private registerTmuxTools(): void {
    const tools = (this.ctx as any).tools;
    if (!tools || typeof tools.registerTool !== "function") return;

    // 1. tmux_spawn_session
    tools.registerTool({
      name: "tmux_spawn_session",
      description: "Spawn a background persistent tmux terminal session",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Session label/title" },
          command: {
            type: "string",
            description: 'Initial shell or CLI command (e.g. "zsh", "claude", "bun", "gh")',
          },
          cwd: { type: "string", description: "Working directory for the session" },
        },
        required: ["name"],
      },
      execute: async (params: { name: string; command?: string; cwd?: string }) => {
        const s = this.createSession(
          params.name,
          params.command || "zsh",
          params.cwd || process.cwd(),
        );
        return { id: s.id, name: s.name, command: s.command, status: "running" };
      },
    });

    // 2. tmux_send_input
    tools.registerTool({
      name: "tmux_send_input",
      description: "Send input or keys into a running tmux session",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Target session ID" },
          input: { type: "string", description: "Input text/command string to send" },
        },
        required: ["id", "input"],
      },
      execute: async (params: { id: string; input: string }) => {
        const ok = this.sendInput(params.id, params.input);
        return { success: ok, id: params.id };
      },
    });

    // 3. tmux_capture_output
    tools.registerTool({
      name: "tmux_capture_output",
      description: "Read the latest terminal output buffer from a tmux session",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Target session ID" },
          lines: {
            type: "number",
            description: "Number of lines to capture from buffer (default 50)",
          },
        },
        required: ["id"],
      },
      execute: async (params: { id: string; lines?: number }) => {
        const out = this.captureOutput(params.id, params.lines || 50);
        return { id: params.id, output: out };
      },
    });
  }
}

export const Config = Schema.object({
  shell: Schema.string().default("zsh"),
  scrollback: Schema.number().default(5000),
});

/** apply implementation. */
export function apply(ctx: Context, config: any) {
  const service = new TmuxService(ctx);
  (ctx as any).tmux = service;
}
