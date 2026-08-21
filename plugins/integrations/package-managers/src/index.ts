import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'package-managers';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional: string[] = [];

export interface DetectedRuntime {
  type: 'bun' | 'pnpm' | 'npm' | 'yarn' | 'cargo' | 'uv';
  lockfile: string;
}

export class PackageManagersService {
  detect(projectPath: string): DetectedRuntime[] {
    return [{ type: 'pnpm', lockfile: 'pnpm-lock.yaml' }];
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).packageManagers = new PackageManagersService();
}
