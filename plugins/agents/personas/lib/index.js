import Schema from '@deepseek-ai/schemastery';
export const name = 'personas';
export const inject = ['llm', 'sessions', 'slots'];
export const optional = ['icons'];
export class PersonasService {
    roster = new Map();
    register(persona) {
        this.roster.set(persona.id, persona);
    }
    get(id) {
        return this.roster.get(id);
    }
    list() {
        return Array.from(this.roster.values());
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.personas = new PersonasService();
}
