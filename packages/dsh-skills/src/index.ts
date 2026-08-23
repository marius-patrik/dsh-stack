import { Service, type Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "skills";
export const inject = ["tools"];
export const optional: string[] = [];

export class SkillLoaderService extends Service {
  static inject = ["tools"];
  private loadedSkills = new Set<string>();

  constructor(ctx: Context) {
    super(ctx, "skills");
  }

  loadSkill(skillName: string): boolean {
    if (!skillName.trim()) return false;
    this.loadedSkills.add(skillName);
    return true;
  }

  hasSkill(skillName: string): boolean {
    return this.loadedSkills.has(skillName);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context): void {
  new SkillLoaderService(ctx);
}
