import type { Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "voice-synthesis";
export const inject = ["webServer", "slots"];
export const optional = ["llm"];

export class VoiceSynthesisService {
  speak(text: string): boolean {
    return true;
  }
}

export const Config = Schema.object({
  enabled: Schema.boolean().default(true),
  voice: Schema.string().default("default"),
});

export function apply(ctx: Context) {
  (ctx as any).voice = new VoiceSynthesisService();
}
