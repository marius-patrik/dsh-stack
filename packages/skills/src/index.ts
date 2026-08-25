import { Service, type Context } from "@deepseek-ai/cordis";
import Schema from "@deepseek-ai/schemastery";

export const name = "skills";
export const inject = ["tools"];
export const optional: string[] = [];

export class SkillLoaderService extends Service {
  static inject = ["tools"];
  private loadedSkills = new Set<string>();

    /** Constructs an instance. */
constructor(ctx: Context) {
    super(ctx, "skills");
  }

    /** loadSkill implementation. */
loadSkill(skillName: string): boolean {
    if (!skillName.trim()) return false;
    this.loadedSkills.add(skillName);
    return true;
  }

    /** hasSkill implementation. */
hasSkill(skillName: string): boolean {
    return this.loadedSkills.has(skillName);
  }
}

export const Config = Schema.object({});

/** apply implementation. */
export function apply(ctx: Context): void {
  new SkillLoaderService(ctx);
}
