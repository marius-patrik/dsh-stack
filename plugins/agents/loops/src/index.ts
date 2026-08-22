import { Service, type Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'loops'
export const inject = ['llm', 'tools', 'sessions']
export const optional: string[] = []

export class DarkFactoryLoopService extends Service {
  static inject = ['llm', 'tools', 'sessions']
  private activeLoops = new Map<string, { goal: string; status: 'running' | 'idle' }>()

  constructor(ctx: Context) {
    super(ctx, 'loops')
  }

  startGoal(id: string, goal: string): void {
    this.activeLoops.set(id, { goal, status: 'running' })
  }

  getGoal(id: string): { goal: string; status: 'running' | 'idle' } | undefined {
    return this.activeLoops.get(id)
  }
}

export const Config = Schema.object({})

export function apply(ctx: Context): void {
  new DarkFactoryLoopService(ctx)
}
