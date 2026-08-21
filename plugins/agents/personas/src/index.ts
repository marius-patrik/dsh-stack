import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'personas';
export const inject = ['llm', 'sessions', 'slots'];
export const optional = ['icons'];

export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model?: string;
  tools?: string[];
}

export class PersonasService {
  private roster = new Map<string, AgentPersona>();

  register(persona: AgentPersona): void {
    this.roster.set(persona.id, persona);
  }

  get(id: string): AgentPersona | undefined {
    return this.roster.get(id);
  }

  list(): AgentPersona[] {
    return Array.from(this.roster.values());
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).personas = new PersonasService();
}
