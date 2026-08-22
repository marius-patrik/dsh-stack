import type { Context } from '@deepseek-ai/cordis';

export const name = 'icon-engine';
export const inject: readonly string[] = [];
export const optional: readonly string[] = [];

export interface IconPack {
  readonly id: string;
  readonly name: string;
  readonly getIcon: (iconId: string) => string | null;
}

export interface IconResolutionInput {
  readonly fileName?: string;
  readonly extension?: string;
  readonly languageId?: string;
  readonly folderName?: string;
  readonly isExpanded?: boolean;
  readonly isRoot?: boolean;
}

export class IconEngineService {
  private readonly packs = new Map<string, IconPack>();
  private readonly mappings = new Map<string, string>();

  registerPack(pack: IconPack): void {
    if (!pack.id.trim()) throw new Error('Icon pack id must not be empty');
    if (this.packs.has(pack.id)) throw new Error(`Icon pack already registered: ${pack.id}`);
    this.packs.set(pack.id, pack);
  }

  unregisterPack(id: string): boolean {
    return this.packs.delete(id);
  }

  listPacks(): readonly IconPack[] {
    return [...this.packs.values()];
  }

  setMapping(key: string, iconId: string): void {
    if (!key.trim()) throw new Error('Icon mapping key must not be empty');
    if (!iconId.trim()) throw new Error('Icon id must not be empty');
    this.mappings.set(key, iconId);
  }

  resolveIcon(input: IconResolutionInput): string {
    const keys = resolutionKeys(input);
    for (const key of keys) {
      const mapped = this.mappings.get(key);
      if (mapped) return mapped;
    }

    for (const pack of this.packs.values()) {
      for (const key of keys) {
        const icon = pack.getIcon(key);
        if (icon) return icon;
      }
    }

    return 'file';
  }
}

function resolutionKeys(input: IconResolutionInput): readonly string[] {
  const keys: string[] = [];
  if (input.fileName) keys.push(`file:${input.fileName}`);
  if (input.isRoot && input.folderName) {
    keys.push(`root:${input.isExpanded ? 'expanded' : 'collapsed'}:${input.folderName}`);
  }
  if (input.folderName) {
    keys.push(`folder:${input.isExpanded ? 'expanded' : 'collapsed'}:${input.folderName}`);
    keys.push(`folder:${input.folderName}`);
  }
  if (input.languageId) keys.push(`language:${input.languageId}`);
  if (input.extension) {
    const normalized = input.extension.startsWith('.') ? input.extension.slice(1) : input.extension;
    keys.push(`extension:${normalized.toLowerCase()}`);
  }
  return keys;
}

export function apply(ctx: Context): void {
  ctx.provide('icons', new IconEngineService());
}
