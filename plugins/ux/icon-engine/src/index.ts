import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'icon-engine';
export const inject = ['webServer', 'slots'];
export const optional: string[] = [];

export interface IconPack {
  id: string;
  name: string;
  getIcon(name: string): string | null;
}

export class IconEngineService {
  private packs = new Map<string, IconPack>();
  private mappings = new Map<string, string>();

  registerPack(pack: IconPack): void {
    this.packs.set(pack.id, pack);
  }

  setMapping(pattern: string, iconId: string): void {
    this.mappings.set(pattern, iconId);
  }

  resolveIcon(fileNameOrType: string): string | null {
    const ext = fileNameOrType.includes('.') ? fileNameOrType.split('.').pop() || '' : fileNameOrType;
    return this.mappings.get(ext) || 'file';
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).icons = new IconEngineService();
}
