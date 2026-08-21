import Schema from '@deepseek-ai/schemastery';
export const name = 'tmux-terminal';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional = [];
export class TmuxService {
    sessions = new Map();
    createSession(name, command = 'zsh') {
        const s = { id: 'term-' + Date.now(), name, command, running: true };
        this.sessions.set(s.id, s);
        return s;
    }
    listSessions() {
        return Array.from(this.sessions.values());
    }
    killSession(id) {
        this.sessions.delete(id);
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.tmux = new TmuxService();
}
