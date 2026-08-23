import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "docker-sandbox";
export const inject = ["tools", "integrations", "webServer"];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Mounts Docker sandbox manager
}
