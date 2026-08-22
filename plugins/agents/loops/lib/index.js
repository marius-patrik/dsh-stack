import Schema from '@deepseek-ai/schemastery';
export const name = 'loops';
export const inject = ['llm', 'tools', 'sessions'];
export const optional = [];
export class DarkFactoryLoopService {
    activeLoops = new Map();
    startGoal(id, goal) {
        this.activeLoops.set(id, { goal, status: 'running' });
    }
    getGoal(id) {
        return this.activeLoops.get(id);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.loops = new DarkFactoryLoopService();
}
