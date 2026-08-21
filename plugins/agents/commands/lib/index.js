import Schema from '@deepseek-ai/schemastery';
export const name = 'commands';
export const inject = ['slots', 'sessions', 'actions'];
export const optional = [];
export class CommandsService {
    commands = new Map();
    register(cmd) {
        this.commands.set(cmd.name, cmd);
    }
    list() {
        return Array.from(this.commands.values());
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.commands = new CommandsService();
}
