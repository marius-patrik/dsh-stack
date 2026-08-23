import Schema from '@deepseek-ai/schemastery';
export const name = 'actions';
export const inject = ['llm', 'tools', 'sessions'];
export const optional = [];
export class ActionsService {
    activeActions = new Map();
    setAction(sessionId, mode) {
        this.activeActions.set(sessionId, { sessionId, mode, toolPolicy: 'auto' });
    }
    getAction(sessionId) {
        return this.activeActions.get(sessionId);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.actions = new ActionsService();
}
