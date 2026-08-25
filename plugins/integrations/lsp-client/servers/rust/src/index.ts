import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "lsp-server-rust";
export const inject = ["lsp", "tools"];
export const optional: string[] = [];

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context) {
  if ((ctx as any).lsp) {
    (ctx as any).lsp.registerServer("rust", { name: "rust-server" });
  }
}
