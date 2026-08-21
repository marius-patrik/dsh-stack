import Schema from '@deepseek-ai/schemastery';
export const name = 'code-server';
export const inject = ['integrations', 'webServer', 'slots'];
export const optional = [];
export class CodeServerManager {
    ctx;
    config;
    status = {
        running: false,
        port: 8080,
        host: '127.0.0.1',
        url: 'http://127.0.0.1:8080'
    };
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        if (config?.port) {
            this.status.port = config.port;
            this.status.url = `http://${this.status.host}:${config.port}`;
        }
    }
    getStatus() {
        return { ...this.status };
    }
    async startServer() {
        this.status.running = true;
        this.status.pid = 9999;
        if (this.ctx.emit) {
            this.ctx.emit('code-server:started', this.status);
        }
        return this.getStatus();
    }
    async stopServer() {
        this.status.running = false;
        this.status.pid = undefined;
        if (this.ctx.emit) {
            this.ctx.emit('code-server:stopped');
        }
        return true;
    }
}
export const Config = Schema.object({
    port: Schema.number().default(8080),
    auth: Schema.string().default('none'),
    telemetry: Schema.boolean().default(false)
});
export function apply(ctx, config) {
    const service = new CodeServerManager(ctx, config);
    ctx.codeServer = service;
}
