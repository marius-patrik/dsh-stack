import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "lsp-client";
export const inject = ["tools", "integrations", "webServer"];
export const optional: string[] = [];

export interface LspPosition {
  line: number;
  character: number;
}

export interface LspRange {
  start: LspPosition;
  end: LspPosition;
}

export interface LspDiagnostic {
  range: LspRange;
  severity: 1 | 2 | 3 | 4; // 1 = Error, 2 = Warning, 3 = Info, 4 = Hint
  message: string;
  source?: string;
}

export interface LspHoverResult {
  contents: string | string[];
  range?: LspRange;
}

export interface LspDefinitionResult {
  uri: string;
  range: LspRange;
}

export interface LspServerHandler {
  name: string;
  languages: string[];
  getHover?: (uri: string, pos: LspPosition) => Promise<LspHoverResult | null>;
  getDefinition?: (uri: string, pos: LspPosition) => Promise<LspDefinitionResult[] | null>;
  getDiagnostics?: (uri: string) => Promise<LspDiagnostic[]>;
  getReferences?: (uri: string, pos: LspPosition) => Promise<LspDefinitionResult[]>;
}

export class LspClientService {
  private servers = new Map<string, LspServerHandler>();
  private diagnosticsCache = new Map<string, LspDiagnostic[]>();

  constructor(private ctx: Context) {
    this.registerLspTools();
  }

  registerServer(lang: string, server: LspServerHandler): void {
    this.servers.set(lang, server);
    for (const l of server.languages || [lang]) {
      this.servers.set(l, server);
    }
  }

  getServerForFile(filePath: string): LspServerHandler | undefined {
    const ext = filePath.includes(".") ? filePath.split(".").pop() || "" : filePath;
    return this.servers.get(ext);
  }

  setDiagnostics(filePath: string, diagnostics: LspDiagnostic[]): void {
    this.diagnosticsCache.set(filePath, diagnostics);
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit("lsp:diagnostics", { filePath, diagnostics });
    }
  }

  getDiagnostics(filePath: string): LspDiagnostic[] {
    return this.diagnosticsCache.get(filePath) || [];
  }

  private registerLspTools(): void {
    const tools = (this.ctx as any).tools;
    if (!tools || typeof tools.registerTool !== "function") return;

    // 1. lsp_hover
    tools.registerTool({
      name: "lsp_hover",
      description:
        "Get hover type information and docstrings for a symbol at a specific file position",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" },
          line: { type: "number", description: "Line number (0-indexed)" },
          character: { type: "number", description: "Character column (0-indexed)" },
        },
        required: ["path", "line", "character"],
      },
      execute: async (params: { path: string; line: number; character: number }) => {
        const s = this.getServerForFile(params.path);
        if (s && s.getHover) {
          return await s.getHover(params.path, { line: params.line, character: params.character });
        }
        return { contents: `No active LSP server for ${params.path}` };
      },
    });

    // 2. lsp_definition
    tools.registerTool({
      name: "lsp_definition",
      description: "Find definition target for symbol at cursor",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" },
          line: { type: "number", description: "Line number (0-indexed)" },
          character: { type: "number", description: "Character column (0-indexed)" },
        },
        required: ["path", "line", "character"],
      },
      execute: async (params: { path: string; line: number; character: number }) => {
        const s = this.getServerForFile(params.path);
        if (s && s.getDefinition) {
          return await s.getDefinition(params.path, {
            line: params.line,
            character: params.character,
          });
        }
        return [];
      },
    });

    // 3. lsp_diagnostics
    tools.registerTool({
      name: "lsp_diagnostics",
      description: "Get live lint and compiler diagnostics for a file",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "File path" },
        },
        required: ["path"],
      },
      execute: async (params: { path: string }) => {
        const s = this.getServerForFile(params.path);
        if (s && s.getDiagnostics) {
          const fresh = await s.getDiagnostics(params.path);
          this.setDiagnostics(params.path, fresh);
          return fresh;
        }
        return this.getDiagnostics(params.path);
      },
    });
  }
}

export const Config = Schema.object({
  enableAutoHover: Schema.boolean().default(true),
  diagnosticsDebounceMs: Schema.number().default(250),
});

export function apply(ctx: Context, config: any) {
  const service = new LspClientService(ctx);
  (ctx as any).lsp = service;
}
