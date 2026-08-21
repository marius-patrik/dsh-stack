import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'skills';
export const inject = ['tools'];
export const optional: string[] = [];

export class SkillLoaderService {
  private loadedSkills = new Set<string>();

  loadSkill(skillName: string): boolean {
    this.loadedSkills.add(skillName);
    return true;
  }

  hasSkill(skillName: string): boolean {
    return this.loadedSkills.has(skillName);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).skills = new SkillLoaderService();
}
