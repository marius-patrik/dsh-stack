import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'loops';
export const inject = ['llm', 'tools', 'sessions'];
export const optional: string[] = [];

export class DarkFactoryLoopService {
  private activeLoops = new Map<string, { goal: string; status: 'running' | 'idle' }>();

  startGoal(id: string, goal: string): void {
    this.activeLoops.set(id, { goal, status: 'running' });
  }

  getGoal(id: string) {
    return this.activeLoops.get(id);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).loops = new DarkFactoryLoopService();
}
