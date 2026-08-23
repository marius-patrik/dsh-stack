import Schema from '@deepseek-ai/schemastery';
export const name = 'skills';
export const inject = ['tools'];
export const optional = [];
export class SkillLoaderService {
    loadedSkills = new Set();
    loadSkill(skillName) {
        this.loadedSkills.add(skillName);
        return true;
    }
    hasSkill(skillName) {
        return this.loadedSkills.has(skillName);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.skills = new SkillLoaderService();
}
