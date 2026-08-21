import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'tmux-terminal';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional: string[] = [];

export interface TmuxSession {
  id: string;
  name: string;
  command: string;
  running: boolean;
}

export class TmuxService {
  private sessions = new Map<string, TmuxSession>();

  createSession(name: string, command: string = 'zsh'): TmuxSession {
    const s: TmuxSession = { id: 'term-' + Date.now(), name, command, running: true };
    this.sessions.set(s.id, s);
    return s;
  }

  listSessions(): TmuxSession[] {
    return Array.from(this.sessions.values());
  }

  killSession(id: string): void {
    this.sessions.delete(id);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).tmux = new TmuxService();
}
