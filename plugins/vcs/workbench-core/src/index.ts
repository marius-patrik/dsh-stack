import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'workbench-core';
export const inject = ['tools', 'webServer'];
export const optional = ['icons'];

export interface RepoDetails {
  path: string;
  branch: string;
  remoteUrl?: string;
  isLocalOnly: boolean;
}

export class ReposWorkbenchService {
  private repos = new Map<string, RepoDetails>();

  registerRepo(details: RepoDetails): void {
    this.repos.set(details.path, details);
  }

  getRepo(path: string): RepoDetails | undefined {
    return this.repos.get(path);
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).repos = new ReposWorkbenchService();
}
