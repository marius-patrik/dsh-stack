import Schema from '@deepseek-ai/schemastery';
export const name = 'tmux-terminal';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional = [];
export class TmuxService {
    ctx;
    sessions = new Map();
    constructor(ctx) {
        this.ctx = ctx;
        this.registerTmuxTools();
    }
    createSession(name, command = 'zsh', cwd = process.cwd()) {
        const id = 'tmux-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        const session = {
            id,
            name,
            command,
            cwd,
            running: true,
            history: [`[session ${name} started with ${command}]`],
            createdAt: Date.now()
        };
        this.sessions.set(id, session);
        if (this.ctx.emit) {
            this.ctx.emit('tmux:session-created', session);
        }
        return session;
    }
    sendInput(id, input) {
        const s = this.sessions.get(id);
        if (!s || !s.running)
            return false;
        s.history.push(input);
        if (this.ctx.emit) {
            this.ctx.emit('tmux:output', { id, text: input });
        }
        return true;
    }
    captureOutput(id, linesCount = 50) {
        const s = this.sessions.get(id);
        if (!s)
            return '';
        return s.history.slice(-linesCount).join('\n');
    }
    listSessions() {
        return Array.from(this.sessions.values());
    }
    killSession(id) {
        const s = this.sessions.get(id);
        if (!s)
            return false;
        s.running = false;
        this.sessions.delete(id);
        if (this.ctx.emit) {
            this.ctx.emit('tmux:session-killed', { id });
        }
        return true;
    }
    registerTmuxTools() {
        const tools = this.ctx.tools;
        if (!tools || typeof tools.registerTool !== 'function')
            return;
        // 1. tmux_spawn_session
        tools.registerTool({
            name: 'tmux_spawn_session',
            description: 'Spawn a background persistent tmux terminal session',
            parameters: {
                type: 'object',
                properties: {
                    name: { type: 'string', description: 'Session label/title' },
                    command: { type: 'string', description: 'Initial shell or CLI command (e.g. "zsh", "claude", "bun", "gh")' },
                    cwd: { type: 'string', description: 'Working directory for the session' }
                },
                required: ['name']
            },
            execute: async (params) => {
                const s = this.createSession(params.name, params.command || 'zsh', params.cwd || process.cwd());
                return { id: s.id, name: s.name, command: s.command, status: 'running' };
            }
        });
        // 2. tmux_send_input
        tools.registerTool({
            name: 'tmux_send_input',
            description: 'Send input or keys into a running tmux session',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Target session ID' },
                    input: { type: 'string', description: 'Input text/command string to send' }
                },
                required: ['id', 'input']
            },
            execute: async (params) => {
                const ok = this.sendInput(params.id, params.input);
                return { success: ok, id: params.id };
            }
        });
        // 3. tmux_capture_output
        tools.registerTool({
            name: 'tmux_capture_output',
            description: 'Read the latest terminal output buffer from a tmux session',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'Target session ID' },
                    lines: { type: 'number', description: 'Number of lines to capture from buffer (default 50)' }
                },
                required: ['id']
            },
            execute: async (params) => {
                const out = this.captureOutput(params.id, params.lines || 50);
                return { id: params.id, output: out };
            }
        });
    }
}
export const Config = Schema.object({
    shell: Schema.string().default('zsh'),
    scrollback: Schema.number().default(5000)
});
export function apply(ctx, config) {
    const service = new TmuxService(ctx);
    ctx.tmux = service;
}
