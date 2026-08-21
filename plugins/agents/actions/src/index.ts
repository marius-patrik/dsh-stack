import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'actions';
export const inject = ['llm', 'tools', 'sessions'];
export const optional: string[] = [];

export interface ActionContext {
  sessionId: string;
  mode: 'code' | 'architect' | 'ask' | 'standard';
  toolPolicy: 'auto' | 'confirm' | 'deny';
}

export class ActionsService {
  private activeActions = new Map<string, ActionContext>();

  setAction(sessionId: string, mode: ActionContext['mode']): void {
    this.activeActions.set(sessionId, { sessionId, mode, toolPolicy: 'auto' });
  }

  getAction(sessionId: string): ActionContext | undefined {
    return this.activeActions.get(sessionId);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).actions = new ActionsService();
}
